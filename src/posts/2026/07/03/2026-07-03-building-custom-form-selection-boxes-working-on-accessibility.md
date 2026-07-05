---
layout: post
title: "Building Custom Form Selection Boxes - Working on Accessibility"
date: "2026-07-03T18:00:00"
categories: ["development"]
tags: ["css"]
banner_image: /images/banners/cat_form.jpg
permalink: /2026/07/03/building-custom-form-selection-boxes-working-on-accessibility
description: An update related to my last post, working on accessibility concerns.
---

Whenever I find myself needing to update a previous blog post, I either correct it inline and add a small note on top, for small tweaks, or write a whole new piece for larger changes. My [last blog post](https://www.raymondcamden.com/2026/07/01/building-custom-form-selection-blocks-no-js-all-css) talked about how to use CSS to style a "block" such that it acted like a form radio button. When I worked on that demo, I was a bit worried about accessibility. I did one quick check with an online tool, and thought I was ok. I was not.

When I shared my post on LinkedIn, [Kevin Bonett](https://www.linkedin.com/in/kevbonett/) shared this feedback with me:

<blockquote>
<p>
I would argue that, despite using correct semantic HTML, the "custom" radio buttons are inaccessible.
</p>
<p>
If you're a sighted keyboard user, how will you know how to interact with the radios, because they look nothing like traditional controls?
</p>
<p>
Radio selection is usually made with ARROW keys. There's nothing to visually suggest this.
</p>
<p>
Users may become frustrated because they're trying to use TAB key instead to access the 2nd radio.
</p>
</blockquote>

This all made sense to me, so I turned to [Cursor](https://cursor.com) for help. The first thing I did was download the CodePen assets locally. I knew my agent in Cursor could work with the remote URL, but as far as I know, could not edit my CodePen for me, and I wanted to give the agent the ability to edit locally so I could test and confirm. 

With the files in place locally, I started with this prompt:

```
I built this demo to showcase how to have a 'custom' block of HTML that
could be selected and used in a form. I did an online check for
accessibility and while it reported a few issues, none seemed to
imply to the form concept that I was testing, the customized 
radio blocks. I blogged about this demo here. https://www.raymondcamden.com/2026/07/01/building-custom-form-selection-blocks-no-js-all-css. 

When I shared this online, a user sent this feedback:

"I would argue that, despite using correct semantic HTML,
the "custom" radio buttons are inaccessible.

If you're a sighted keyboard user, how will you know 
how to interact with the radios, because they look
nothing like traditional controls?

Radio selection is usually made with ARROW keys. There's
nothing to visually suggest this.

Users may become frustrated because they're trying to use
TAB key instead to access the 2nd radio."

Given this feedback, what do you think, and what can we do to 
improve the demo?
```

The response from this was pretty stellar, and I think a lot better than if I had simply said "work on accessibility". By bringing in Kevin's details, I think it really helped focus the agent's work when looking at my code. 

Here's the response, and it's pretty extensive, you would be fine scrolling down to the Summary:

<script type="module" src="https://cdn.jsdelivr.net/npm/zero-md@3?register"></script>
<zero-md>
<template data-append>
<style>
.markdown-body {
padding: 20px;
}
</style>
</template>
  <script type="text/markdown">
The feedback is fair, and it points at a real gap — not broken semantics, but missing **keyboard affordance** and **visible focus**.

## My take

Your HTML foundation is sound. Real `<input type="radio">` elements inside `<label>` wrappers is the right pattern: screen readers get a proper radio group, arrow keys work natively, and form submission behaves correctly. An automated checker can pass that and still miss the sighted keyboard-user experience.

The reviewer is describing that gap. Custom cards that look like clickable tiles don’t read as “radio group” to someone tabbing through the form. That’s an **operability** and **perceivability** problem, not a semantic one.

## What actually happens for keyboard users

Native radio groups behave like this:

1. **Tab** moves into the group (to the selected radio, or the first one if nothing is selected).
2. **Tab again** skips the other radios and goes to the next control (Submit).
3. **Arrow keys** move between options in the group.

That Tab behavior is correct per the spec, but your demo gives users almost no signal for it. The radios are hidden with zero size and no opacity:

```1:6:style.css
.custom-card input[type="radio"] {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }
```

There’s also no `:focus` or `:focus-within` styling on the cards. A sighted keyboard user can land on Option 1, press Tab expecting Option 2, jump straight to Submit, and never see which card had focus. Arrow keys may work, but nothing suggests they should try them.

So: **technically functional, practically confusing** for that audience.

## What to improve (still no JS)

### 1. Visible focus on the card (`:focus-within`) — highest impact

When the hidden radio inside a label has focus, style the whole card:

```css
.custom-card:focus-within {
  outline: 3px solid #005fcc;
  outline-offset: 2px;
}

.custom-card:focus-within:not(:has(input:checked)) {
  border-color: #005fcc;
  box-shadow: 0 0 0 3px rgba(0, 95, 204, 0.25);
}
```

This alone fixes “I tabbed here and have no idea where I am.”

### 2. Group label with `<fieldset>` and `<legend>`

Wrap the options so the group has a name and context:

```html
<fieldset>
  <legend>Choose a cat</legend>
  <!-- your custom-card labels -->
</fieldset>
```

Screen readers announce the group; sighted users get a clear heading for the choice block.

### 3. Short keyboard hint (visible text)

One line above or below the cards:

> Use **Tab** to reach this choice, then **arrow keys** to switch options.

You shouldn’t rely on this alone, but it sets expectations for the non-obvious Tab vs. arrow behavior. `aria-describedby` can tie it to the group for assistive tech.

### 4. A small “single choice” visual cue

You don’t need to restore default radio chrome. A corner circle, checkmark when selected, or “Selected” badge helps users map cards to “pick one of several.” Selection state is only a blue background today, which is weaker for color vision and for understanding control type.

### 5. Prefer a proper visually-hidden pattern over `width: 0; height: 0`

Clip-based hiding keeps inputs reliably focusable and is a well-known pattern:

```css
.custom-card input[type="radio"] {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

Pair that with `:focus-within` on the label so focus is always visible on the card, not on a 1×1 pixel.

### 6. Don’t fight native Tab behavior

Making each card a separate tab stop (e.g. `tabindex="0"` on labels) would **break** expected radio keyboard behavior. Keep native radios; improve focus visibility and set expectations instead.

## What you can say in the blog

Something like:

> The pattern uses real radio inputs for semantics and form behavior. Custom styling hides the native control, so we add `:focus-within` on each card, group the options in a `fieldset`, and include a brief keyboard hint. Arrow keys switch options; Tab moves to the next field — standard radio behavior that’s easy to miss when the UI looks like generic cards.

That shows you’re addressing operability, not just checkbox-audit semantics.

## Summary

| Concern | Valid? | Fix |
|--------|--------|-----|
| Doesn’t look like radios | Yes | Focus ring, optional radio/check indicator |
| Arrow keys not suggested | Yes | Hint text + fieldset/legend |
| Tab doesn’t reach 2nd option | Partially — that’s correct radio behavior | Explain it; don’t change tab order |
| Semantics wrong | No | Keep current HTML pattern |

I’d treat this as “good foundation, needs keyboard UX polish,” not “start over.” The changes are mostly CSS and a bit of markup — still no JavaScript.

If you want, I can apply these updates directly in `index.html` and `style.css` so the demo matches what you’d recommend in a follow-up post.
  </script>
</zero-md>

I went ahead and gave Cursor permission to edit and update my files, and while I'm keeping the original CodePen as is, I pushed up the new files to Netlify: <https://formselectionblock.netlify.app/>

The keyboard navigation is improved and the text helps too. I passed this by Kevin; he agreed with the updates, so going forward when I use this UX on my sites, I'll work with this version. Let me know what you think!


