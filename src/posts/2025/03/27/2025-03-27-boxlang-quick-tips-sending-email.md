---
layout: post
title: "BoxLang Quick Tips - Sending Email"
date: "2025-03-27T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/blqt_mail.jpg
permalink: /2025/03/27/boxlang-quick-tips-sending-email
description: How to send emails with BoxLang
---

Welcome to another [BoxLang](https://boxlang.io) Quick Tip! As with my other quick tips, I'll end this blog post with a link to the video version so feel free to skip down to it, or read, or both if you prefer! Today's quick tip is a look at how BoxLang supports sending email, and as with my previous tips, an additional module is all you need to do.

The [Mail module](https://boxlang.ortusbooks.com/boxlang-framework/modularity/mail) can be installed via the CLI like so: `install-bx-module bx-mail`. Once installed, you get three new components for your runtime:

* mail - This is the core component and handles all mail operations. You'll always use this. It has quite a few options so be sure to check the [docs](https://boxlang.ortusbooks.com/boxlang-framework/modularity/mail), but in general you'll provide the `to`, `from`, `subject`, and authentication information. Any output within the component will become part of the email message.
* mailparam - Used for additional mail parameters like headers and attachments (although the core mail module can handle attachments as well)
* mailpart - Generally only used to handle sending plain text and HTML emails at once.

For my testing, I made use of an excellent open source Windows application, [smtp4dev](https://github.com/rnwood/smtp4dev), which provides a mail server as well as a Windows client that lets you via the emails that were sent to it. It doesn't actually forward anything along, it just holds on to the email, but it's perfect for testing. 

At the simplest, you can send an email like so:

```js
bx:mail
  subject="Funds Available from Your Favorite Nigerian Prince"
  from="prince@gmail.com"
  to="raymomdcamden@gmail.com"
  type="HTML"
  server="192.168.68.50"
{
	writeOutput("I've got so much money for you!");
};
```

A slightly more realistic example may look like so:

```js
items = [
	{"product":"cat", "price": 10.99 },
	{"product":"another cat", "price": 11.99 },
	{"product":"yet another cat", "price": 20.00 },
];

mailBody = "
<h2>Hello Ray</h2>
<p>
Here is info about your order at #dateFormat(now(), "MM/dd/yy")#:
</p>

<table border='1' width='500'>
	<thead>
		<tr>
			<th>Product</th>
			<th>Price</th>
		</tr>
	</thead>
	<tbody>
";

for(item in items) {
	mailBody &= "<tr><td>#item.product#</td><td>#currencyFormat(item.price)#</td></tr>";
}

mailBody &= "
	</tbody>
</table>

<p>
Thank you for your order!
</p>
";

bx:mail
  subject="Your Order"
  from="myshop@ortus.com"
  to="raymomdcamden@gmail.com"
  bcc="orders@ortus.com"
  type="HTML"
  server="192.168.68.50"
{

	writeOutput(mailBody);
};
```

In this script, I've got some data (hard-coded, but you could imagine it coming from a database) that I take and turn into a string that represents order details. After creating the string I can just pass it to the mail component and that's it. 

The result is pretty much what you expected:

<p>
<img src="https://static.raymondcamden.com/images/2025/03/mail1.jpg" alt="View of email" class="imgborder imgcenter" loading="lazy">
</p>

As a quick aside, the smpt4dev client displays `To` twice for some reason. I filed a bug report on it. I'll also note that the email I created is fairly simple and not terribly pretty. That's all me, not BoxLang. You could absolutely create a well designed email.

Sending attachments is also simple. While I mentioned that the `mailparam` component can do that, you don't need to use it for simpler cases, like the following:

```js
bx:mail
  subject="Your File"
  from="myshop@ortus.com"
  to="raymomdcamden@gmail.com"
  bcc="orders@ortus.com"
  server="192.168.68.50"
  mimeAttach=expandPath("./raymond-camden.pdf")
{

	writeOutput("Your file is attached.");
};
```

The `mimeAttach` argument is all you need to include a file. For multiple attachments though you would want to switch to `mailparam`. 

And how about a mass mail example? You can just... loop:

```js
people = ["raymondcamden@gmail.com", "ray@camdenfamily.com", "rcamden@gmail.com"];

for(person in people) {

	content = "
<p>
Something interesting for #person# here...
</p>
	";

	bx:mail
	subject="Your Order"
	from="myshop@ortus.com"
	to=person
	type="HTML"
	server="192.168.68.50"
	{

		writeOutput(content);
	};

}
```

While three emails isn't a lot, you get the idea. Don't forget BoxLang supports [parallel looping](https://www.raymondcamden.com/2025/02/24/using-parallel-looping-in-boxlang) and the above could execute even quicker with about 30 seconds of modification:

```js
people = ["raymondcamden@gmail.com", "ray@camdenfamily.com", "rcamden@gmail.com"];

people.each(person => {

	content = "
<p>
Something interesting for #person# here...
</p>
	";

	bx:mail
	subject="Your Order"
	from="myshop@ortus.com"
	to=person
	type="HTML"
	server="192.168.68.50"
	{

		writeOutput(content);
	};

}, true);
```

I didn't show this in the video but if you want to support both plain text and HTML via `mailparam`, here's a simple example:

```js
htmlContent = "
<p>
Hello <strong>World!</strong>
</p>";

textContent = "Hello Word";

bx:mail
  subject="HTML/Plain Test"
  from="myshop@ortus.com"
  to="raymomdcamden@gmail.com"
  server="192.168.68.50"
{

	bx:mailPart type="text" { writeOutput(textContent); }
	bx:mailPart type="html" { writeOutput(htmlContent); }

};
```

I'd expect most of your code here would involve creating the mail bodies while the actual action of the mail is a few lines, which is what you want I think! You can find these demo scripts here: <https://github.com/ortus-boxlang/bx-demos/tree/master/boxlang_quick_tips/mail>

Alright, if this looks interesting you, definitely give [BoxLang](https://boxlang.io) a spin. Our [installation directions](https://boxlang.ortusbooks.com/getting-started/installation) cover all operating systems and you can get up and running quickly. If you've got questions, head over to our [forum](https://community.ortussolutions.com/c/boxlang/42) or join us on [Slack](https://boxteam.ortussolutions.com/)


{% liteyoutube "s3MAQY8Az_k" %}