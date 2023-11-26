---
layout: post
title: "Using IndexedDB with Alpine.js"
date: "2023-11-26T18:00:00"
categories: ["javascript"]
tags: ["alpinejs"]
banner_image: /images/banners/storage_ij.jpg
permalink: /2023/11/26/using-indexeddb-with-alpinejs
description: A look at integrating IndexedDB (IDB) with Alpine.
---


A lot of my "x with Alpine" blog posts end up being, well, nothing special. That's a good thing I suppose as it really helps highlight how simple [Alpine.js](https://alpinejs.dev) is. (Note, I go back and forth between including the ".js" when referring to Alpine. I *should* be more consistent I suppose. On one hand, Alpine.js is the formal name, but Alpine just feels simpler.) That being said, the impetus for *this* post was to get something basic done before I built something a bit more complex. So if you wish to TLDR - it just works, visit my [CodePen](https://codepen.io/cfjedimaster/pen/RwvJXMr?editors=1010) for the full source, and come back for the next post. If you're still curious, keep on reading.

## IndexedDB - Vanilla or Library?

Back in the Fall of last year, I wrote a short series of posts ([Part One](https://www.raymondcamden.com/2022/08/17/investigating-indexeddb-wrapper-libraries-part-one), [Part Two](https://www.raymondcamden.com/2022/08/18/investigating-indexeddb-wrapper-libraries-part-two), [Part Three](https://www.raymondcamden.com/2022/08/29/investigating-indexeddb-wrapper-libraries-part-three)) showing the same basic application built and making use of IndexedDB via straight vanilla JS and then two libraries to help simplify it a bit. IndexedDB (IDB from here on out) is "a bit" complex, and libraries can definitely help simplify your usage of it, but for today I decided to just use the [API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) without any additional libraries. I've got Alpine in play, and it's *really* lightweight, so I decided to not add any additional libraries.

I also decided to work with the same basic application for this post, a Contacts database. Each contact has a first and last name and an email address. You can see the UI below (every single version used the same layout):

<p>
<img src="https://static.raymondcamden.com/images/2022/08/idb1.jpg" alt="Screenshot of app showing a table of existing contacts on the left, and a form for editing on the right." class="imgborder imgcenter" loading="lazy">
</p>

The left side is a simple table of contacts with an Edit and Delete button. On the right is a form that lets you add new contacts, or edit existing ones. 

In the first [post](https://www.raymondcamden.com/2022/08/17/investigating-indexeddb-wrapper-libraries-part-one) of my series from last year, I had a pretty clear separation between the functions used for DOM stuff and the IDB code. I took a slightly different approach for my Alpine version.

## The Alpine.js Version

Let's start off with the HTML: 

```html
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

<div x-data="app" class="twocol">
	<div>
	<table>
		<thead>
			<tr>
				<th>Last Name</th>
				<th>First Name</th>
				<th>Email</th>
				<th></th>
			</tr>
		</thead>
		<template x-for="contact in contacts">
			<tr>
				<td x-text="contact.lastname"></td>
				<td x-text="contact.firstname"></td>
				<td x-text="contact.email"></td>
				<td><button @click="editContact(contact)">Edit</button> <button @click="deleteContact(contact.id)">Delete</button></td>
			</tr>
		</template>
	</table>
	</div>
	<div>
		<form>
			<input type="hidden" x-model="key">
			<p>
			<label>First Name <input type="text" x-model="firstname"></label><br/>
			<label>Last Name <input type="text" x-model="lastname"></label><br/>
			<label>Email <input type="email" x-model="email"></label><br/>
			</p>
			<p>
			<button @click.prevent="saveContact">Save</button>
			</p>
		</form>
	</div>
</div>
```

You can see Alpine in use in two areas. In the table, I've got a loop over a `contacts` array with buttons making use of the data to pass to the edit and delete functions. Next, I've got a form. It handles both new and existing records so I use a hidden form field to handle storing the primary key for edits. Note the use of `x-model` to bind the values here to data on the Alpine side.

The layout is rather simple, but things get a bit more complex on the Alpine side. I'm going to show this in bite-sized chunks, but I'll share everything at the end. 

First, the variables:

```js
db:null,
contacts:[],
lastname:'',
firstname:'',
email:'',
key:'',
```

The last four fields are used for editing, while the first two relate to the stored information. `db` is a pointer to the IndexedDB database and `contacts` is an array of contacts *copied* from the database. In other words, there's the actual persisted data and a "local" copy in use by Alpine. (Yes, that bugs me too and I'll talk a bit more about it later.)

Next up is the `init()` method:

```js
async init() {
	console.log('setup db', new Date());
	this.db = await this.setupDb();
	console.log('db setup');
	this.contacts = await this.getContacts();
},
```

If you ignore the logs, this does two things - ask for the IDB database object and then a list of existing contacts. Here's how the database is setup:

```js
async setupDb() {
	return new Promise((resolve, reject) => {

		let request = indexedDB.open('alpine_contacts', 1);

		request.onerror = event => {
			alert('Error Event, check console');
			console.error(event);
		}

		request.onupgradeneeded = event => {
			console.log('idb onupgradeneeded firing');

			let db = event.target.result;

			let objectStore = db.createObjectStore('contacts', { keyPath: 'id', autoIncrement:true });
			objectStore.createIndex('lastname', 'lastname', { unique: false });
		};

		request.onsuccess = event => {
			resolve(event.target.result);
		};

	});
},
```

IDB is asynchronous, but not Promise based, so I wrap my use of it with a Promise creator. IDB requires you to open up a database *and* do any structure updates in an `onupgradeneeded` event. In my demo, I simply create a store (think table) with a defined primary key property (`id`) and auto-incrementing keys. Also, an index is used on `lastname`. My demo doesn't actually do any searches so this is kinda pointless. 

Next, this function handles getting all contacts. It was called back in `init`:

```js
async getContacts() {
	return new Promise((resolve, reject) => {
			let transaction = this.db.transaction(['contacts'], 'readonly');

			transaction.onerror = event => {
				reject(event);
			};

			let store = transaction.objectStore('contacts');
			store.getAll().onsuccess = event => {
				resolve(event.target.result);
			};

	});			
},
```

There's nothing Alpine in this at all, just pure IDB code.

Now, here's what `edit` does:

```js
async editContact(contact) {
	console.log(`edit ${contact.id}`);
	this.firstname = contact.firstname;
	this.lastname = contact.lastname;
	this.email = contact.email;
	this.key = contact.id;
},
```

In this case, there's nothing IDB-related. Rather, it's setting the values that will be shown in the form. The `key` value is hidden. Now let's move on to `delete`:

```js
async deleteContact(id) {
	console.log(`delete ${id}`);
	return new Promise((resolve, reject) => {
		let transaction = this.db.transaction(['contacts'], 'readwrite');

		transaction.oncomplete = async event => {
			this.contacts = await this.getContacts();
			resolve();
		};

		transaction.onerror = event => {
			reject(event);
		};

		let store = transaction.objectStore('contacts');
		store.delete(id);
	});
},
```

This is still mostly boilerplate, *except* the `oncomplete`, where when the delete operation is done, I update my local `contacts` array by fetching the information again. 

The final function handles saving both new and existing contacts:

```js
async saveContact() {
	console.log('save called');
	return new Promise((resolve, reject) => {

		let contact = {
			lastname: this.lastname,
			firstname: this.firstname, 
			email: this.email
		};
		
		if(this.key !== '') contact.id = this.key;
		
		let transaction = this.db.transaction(['contacts'], 'readwrite');
		transaction.oncomplete = async event => {
			this.lastname = '';
			this.firstname = '';
			this.email = '';
			this.key = '';
			this.contacts = await this.getContacts();
			resolve();
		};

		transaction.onerror = event => {
			reject(event);
		};

		let store = transaction.objectStore('contacts');
		store.put(contact);

	});
}
```		

I make a `contact` object based on the values from the form field. I only want to include the `id` property when it's not an empty string so I've got a little of logic there. As with the `delete` method, when this transaction is done, I once again fetch the values with a call to `getContacts`.

Here's the complete demo:

<p class="codepen" data-height="600" data-default-tab="html,result" data-slug-hash="RwvJXMr" data-user="cfjedimaster" style="height: 600px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/RwvJXMr">
  Alpine.js with IDB</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

## Final Thoughts

"Final" sounds so dramatic, sorry. As I said, there wasn't anything surprising or special about this particular demo, it was mainly built as I've got something else in mind for later this week. Earlier I talked about how I store a copy of the contacts separate and apart from the stored data. This means I need to ensure that when changes are made (either edits/additions or deletions) I also have to edit the list. Right now the logic is "get everything", which for a short list is fine. This would *not* scale. IDB can store a huge amount of data, but the code as it stands now would not really handle that well. I would probably add pagination of some sort, which *can* be done via IDB with slightly more complex code. Then deletes and edits could be made more intelligent as well. For example, instead of getting everything on an edit, you could simply edit the Alpine array directly. There's probably even more that could be done. As always, reach out! Let me know what you think, and again, I'll be following this up in a few days.


