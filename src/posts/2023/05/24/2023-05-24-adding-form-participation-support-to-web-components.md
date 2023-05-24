---
layout: post
title: "Adding Form Participation Support to Web Components"
date: "2023-05-24T18:00:00"
categories: ["javascript"]
tags: ["web components"]
banner_image: /images/banners/legos.jpg
permalink: /2023/05/24/adding-form-participation-support-to-web-components
description: How a web component can support being part of an existing form.
---

Many years ago when the web platform began to really improve, when everything was "HTML5 this" and "HTML5 that", I remember being particularly excited by the updates to forms. I started my web career doing a lot of form processing and have always thought it was one of the more important aspects of the platform. Anything that improved that was a good thing. In my explorations of web components, I was *ecstatic* to discover that web components can be participants in forms. So what do we mean by that?

## What's a Form Field?

Form fields have a number of different features, including:

* Including a name and value as part of the overall form. This is the bare minimum thing a form field provides.
* Participate in form validation with custom logic.
* Reset, which means different things to different fields.
* Autocomplete 
* Restore (like if you go back after submitting a form, or re-open a closed browser)
* Handle being disabled
* Handle being focused

That's quite a bit, and I'm probably forgetting something, but given the power of forms, the complexity is probably not too surprising. 

## Form Participation in Web Components

The good news is that, as long as you write the code for it, a custom web component can 100% participate in a form. The platform gives you the ability to set up the association, handle things like reset logic and autocomplete/restore, specify custom logic, and the rest of the expected behaviors as well. 

In my research on this topic, I ran across multiple articles on it (and I'll share those at the very end), and in general it didn't seem too hard to do, but I ran into an issue that stopped me completely before I figure it out. Let's start off by looking at the bare minimum requirements for a web component that will work in a form.

## The First Example

Ok, let's begin with a simple component that doesn't actually do anything:

```js
class FormComponent extends HTMLElement {

	constructor() {
		super();
		this.attachShadow({mode:'open'});
	}
	
	connectedCallback() {
		this.shadowRoot.innerHTML = `
<p>
WC Input: <input type="text" name="foo">
</p>
`;

	}
}

if(!customElements.get('form-component')) customElements.define('form-component', FormComponent);
```

This component, creatively-named `form-component`, simply outputs a bit of text and a form field within it's shadow DOM. To start participating in forms, we begin by adding a static `formAssociated` value to the class:

```js
static formAssociated = true;
```

Next, in our constructor, we use `attachInternals` like so:

```js
this.internals = this.attachInternals();
```

The `attachInternals` method (documented [here](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/attachInternals) on MDN) adds support for forms. In some examples, I saw private members used for the pointer, or 'fake' private members using names like `internals_`. That's not required, but you may see it in the wild.

Then we need logic to set the value in terms of what the form is going to send. That's a bit wordy, but essentially there is a special way for your code to set the value that represents itself in the form. This is done like so:

```js
this.internals.setFormValue("something here");
```

And in theory, that's it. In practice, I saw something else that was required as well. And maybe it was obvious, but it wasn't for me. In order for your custom component to be a part of the form, it must use the `name` attribute. If you are building a form that will post to a server and *not* using JavaScript instead, then this is how it's always been. But it just didn't click to me that I needed it and kept seeing my web component value missing in the post. Anyway, just add a `name`:

```html
<form-component name="mycomponent"></form-component>
```

Let's consider an example, and let me preface it by saying this is a bit messy. I spent a good amount of time messing around with stuff when it wasn't working right.

```js
class FormComponent extends HTMLElement {

	static formAssociated = true;

	constructor() {
		super();
		this.internals = this.attachInternals();
		this.attachShadow({mode:'open'});
	}
	
	connectedCallback() {
		this.shadowRoot.innerHTML = `
<p>
WC Input: <input type="text" name="foo">
</p>
`;
    
		// set a default
		this.internals.setFormValue('');

		const input = this.shadowRoot.querySelector('input');
		input.addEventListener('change', () => {
        	this.internals.setFormValue(input.value);
    	});

	}

	// This is just to test something	
	get value() {
		return 'moo';
	}
}

if(!customElements.get('form-component')) customElements.define('form-component', FormComponent);
```

Alright, in my constructor, I'm setting up a shadow DOM as well as attaching internals as described before. 

In `connectedCallback`, I output a bit of HTML. I want you to notice the `name` there. This is *not* what is sent on posting the form, instead it's the name used when the component is in the DOM. I kept that there as a reminder to myself. 

The next line sets a form value of an empty string. Why? Here was another interesting tidbit. If I submitted my form without typing anything, the form field did *not* show up in the post. This was not how other form fields acted, so for example, a text field. My guess is that with no value, it was null, so it didn't get sent along. Starting off by setting it to a string means I'd at least get the form field name there and an empty value.

Finally, I find the input field and listen for change events. When that fires, I update the form value.

That last bit of code, the getter for `value`, is a bit of trash in this example but demonstrates something interesting. If in my code I query selected my `form-component` tag and output the value, I got nothing, even if I had typed something. That's because there wasn't a `value` property of the web component. There *is* an associated form value, that's set with `setFormValue`, but it is *not* the same as a `value` property itself. 

I may not have done the best job explaining that and I apologize, but it *kinda* makes sense. You can test this below. All I'm doing in the form action is posting to an echo service.

<p class="codepen" data-height="500" data-default-tab="result" data-slug-hash="qBJgwbB" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/qBJgwbB">
  FP1</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

## The Better Example

For my first "real" example (and this will still be somewhat incomplete), I thought it would be cool to build a "gradient" form field. Essentially a form field that lets you pick two colors with the idea that they represent a color gradient. I'll show how it looks in usage before sharing the code behind it:

```html
<h2>Form</h2>
<form action="https://postman-echo.com/post" method="post" id="mainForm">
	<p>
		<label for="name">Name: 
		<input name="name" id="name" value="ray">
	</p>
	<p>
		<label for="theme">Theme: </label>
		<gradient-component name="theme" id="theme"></gradient-component>
	</p>
	<input type="submit"> <input type="reset">
</form>
```

Now for the component definition:

```js
class GradientComponent extends HTMLElement {

	static formAssociated = true;

	constructor() {
		super();
		this.internals = this.attachInternals();
		this.attachShadow({mode:'open'});
		this.color1 = null;
		this.color2 = null;
	}
	
	connectedCallback() {
		this.shadowRoot.innerHTML = `
<input type="color"> - <input type="color">
`;
    
		// set a default
		this.internals.setFormValue('');

		const inputs = this.shadowRoot.querySelectorAll('input');
		this.color1 = inputs[0];
		this.color2 = inputs[1];
		
		inputs.forEach(i => {
			i.addEventListener('change', () => {
				this.internals.setFormValue(this.value);
			});
		});

	}
		
	formResetCallback() {
		this.color1.value= '#000000';
		this.color2.value= '#000000';
	}
	
	get value() {
		return this.color1.value + '-' + this.color2.value;
	}
}

if(!customElements.get('gradient-component')) customElements.define('gradient-component', GradientComponent);
```

Let me focus on what changed from the initial example. In my constructor, I begin by creating two variables that will eventually point to my two colors. In my `connectedCallback`, I set up the display to be two input fields, using `type="color"`, separated by a dash. That could be prettier/cooler perhaps. I select them from the shadow DOM, add points to those two color variables, and then add event listeners for each. 

The event handler simply asks for the `value` value and uses it in `setFormValue`. My getter for `value` takes the values from the two form fields and delimits them with a dash. So if I picked green and red, I'd get: `#00FF00-#FF0000`. It would be up to the code processing the form to parse it, store it as is, or whatever. 

While I didn't add validation support to this component, I did add `reset` support with the `formResetCallback`. This is called automatically if a reset button is clicked or `reset()` is called on the form object. I simply set the values back to black. 

As I said, I could do more with this, but I think it's pretty cool to start off with. You can play with it yourself below:

<p class="codepen" data-height="500" data-default-tab="result" data-slug-hash="zYmegVv" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/zYmegVv">
  FP2</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

## Resources

While researching this post, I came across some great articles that were helpful:

* [Web Components Can Now Be Native Form Elements](https://javascript.plainenglish.io/web-components-can-now-be-native-form-elements-107c7a93386) by Danny Moerkerke
* [ElementInternals and Form-Associated Custom Elements](https://webkit.org/blog/13711/elementinternals-and-form-associated-custom-elements/) by Ryosuke Niwa
* [More capable form controls](https://web.dev/more-capable-form-controls/) by Arthur Evans

