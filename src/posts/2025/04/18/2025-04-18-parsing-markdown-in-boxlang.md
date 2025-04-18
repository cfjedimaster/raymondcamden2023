---
layout: post
title: "Parsing Markdown in BoxLang"
date: "2025-04-18T18:00:00"
categories: ["development"]
tags: ["boxlang"]
banner_image: /images/banners/cat_two_papers.jpg
permalink: /2025/04/18/parsing-markdown-in-boxlang
description: A look at using BoxLang's Java features to work with Markdown
---

A few months ago, I wrote up a blog post exploring [Java integration in BoxLang](https://www.raymondcamden.com/2025/02/26/using-java-libraries-in-boxlang) and in that post, [Robert Zehnder](https://kisdigital.com/) suggested I get [Flexmark](https://github.com/vsch/flexmark-java) working as well. Flexmark is a Java Markdown library, and turns out, I blogged about it last September: ["Parsing Markdown in ColdFusion"](https://www.raymondcamden.com/2024/09/16/parsing-markdown-in-coldfusion)

That post demonstrated how to use Flexmark in ColdFusion, and initially I didn't think there would be a point in demonstrating the same thing in BoxLang as the syntax would be near identical, but turns out, there's one small difference that's absolutely worth sharing.

Ok, so first off, I grabbed `flexmark-all-0.64.8-lib.jar` from Flexmark's [Maven repository](https://repo1.maven.org/maven2/com/vladsch/flexmark/flexmark-all/0.64.8/). In the previous post I made use of ColdFusion's application framework to define my Java load paths so that ColdFusion could find the jar. For BoxLang, I could do that as well but as I'm building a command line tool and not a web app, I instead made use of the BoxLang feature where `createObject` lets you pass in a jar file. Keep that in mind if you make use of this code in a web environment, you could simply a bit in that context.

Here's the initial function I wrote which is a copy of the previous one, with the addition of specifying the jar:

```js
function markdownToHTML(str) {

	ds = createObject("java", "com.vladsch.flexmark.util.data.MutableDataSet","flexmark-all-0.64.8-lib.jar");
	ps = createObject("java", "com.vladsch.flexmark.parser.Parser","flexmark-all-0.64.8-lib.jar").builder(ds).build();
	hm = createObject("java", "com.vladsch.flexmark.html.HtmlRenderer","flexmark-all-0.64.8-lib.jar").builder(ds).build();
	
	doc = ps.parse(str);
	return hm.render(doc);

}
```

As I mentioned in the previous post, this code came from reading the [sample Java code](https://github.com/vsch/flexmark-java/blob/master/flexmark-java-samples/src/com/vladsch/flexmark/java/samples/BasicSample.java) for Flexmark. But this didn't work! Why?

When run, I got this stacktrace:

```
ortus.boxlang.runtime.types.exceptions.NoMethodException: No such 
method [builder] found in the class [com.vladsch.flexmark.parser.Parser] 
using [1] arguments of types [[class java.lang.Class]]
```

This is referring to the second line in the function and seems to imply the `ds` variable is an instance of `java.lang.Class`, not the class I had initially created. 

Turns out, this is expected as the initial call of creating the object just loads the class, but doesn't actually make an instance of it. The fix is ridiculously simple (scroll to the right):

```js
function markdownToHTML(str) {

	// .init() is important!
	ds = createObject("java", "com.vladsch.flexmark.util.data.MutableDataSet","flexmark-all-0.64.8-lib.jar").init();
	ps = createObject("java", "com.vladsch.flexmark.parser.Parser","flexmark-all-0.64.8-lib.jar").builder(ds).build();
	hm = createObject("java", "com.vladsch.flexmark.html.HtmlRenderer","flexmark-all-0.64.8-lib.jar").builder(ds).build();
	
	doc = ps.parse(str);
	return hm.render(doc);

}
```

I literally just added an `init` call for the `ds` object to properly load an instance and get it running. Something to keep in mind, and given the a) huge amount of open source Java out there and b) BoxLang runs on the JVM, it's an important tip to keep in mind.

Before I leave, one more quick note. In my test script, I made use of another BoxLang feature, tag islands. Tag islands are a way to incorporate tag based syntax within scripts, and honestly, the whole idea horrifies me. I don't know why, it just does. That being said, I've not actually used the feature before, and it can be really useful, for example:

<!-- credit for darkmode gist https://gist.github.com/adimancv/eb2f4b46d3c95e6b8fe4dd52375236b2 -->
<style>
.gist{font-size: 18px}.gist-meta, .gist-file, .octotree_toggle, ul.comparison-list > li.title,button.button, a.button, span.button, button.minibutton, a.minibutton,span.minibutton, .clone-url-button > .clone-url-link{background: linear-gradient(#202020, #181818) !important;border-color: #383838 !important;border-radius: 0 0 3px 3px !important;text-shadow: none !important;color: #b5b5b5 !important}.markdown-format pre, .markdown-body pre, .markdown-format .highlight pre,.markdown-body .highlight pre, body.blog pre, #facebox pre, .blob-expanded,.terminal, .copyable-terminal, #notebook .input_area, .blob-code-context,.markdown-format code, body.blog pre > code, .api pre, .api code,.CodeMirror,.highlight{background-color: #1D1F21!important;color: #C5C8C6!important}.gist .blob-code{padding: 1px 10px !important;text-align: left;background: #000;border: 0}::selection{background: #24890d;color: #fff;text-shadow: none}::-moz-selection{background: #24890d;color: #fff;text-shadow: none}.blob-num{padding: 10px 8px 9px;text-align: right;color: #6B6B6B!important;border: 0}.blob-code,.blob-code-inner{color: #C5C8C6!important}.pl-c,.pl-c span{color: #969896!important;font-style: italic!important}.pl-c1{color: #DE935F!important}.pl-cce{color: #DE935F!important}.pl-cn{color: #DE935F!important}.pl-coc{color: #DE935F!important}.pl-cos{color: #B5BD68!important}.pl-e{color: #F0C674!important}.pl-ef{color: #F0C674!important}.pl-en{color: #F0C674!important}.pl-enc{color: #DE935F!important}.pl-enf{color: #F0C674!important}.pl-enm{color: #F0C674!important}.pl-ens{color: #DE935F!important}.pl-ent{color: #B294BB!important}.pl-entc{color: #F0C674!important}.pl-enti{color: #F0C674!important;font-weight: 700!important}.pl-entm{color: #C66!important}.pl-eoa{color: #B294BB!important}.pl-eoac{color: #C66!important}.pl-eoac .pl-pde{color: #C66!important}.pl-eoai{color: #B294BB!important}.pl-eoai .pl-pde{color: #B294BB!important}.pl-eoi{color: #F0C674!important}.pl-k{color: #B294BB!important}.pl-ko{color: #B294BB!important}.pl-kolp{color: #B294BB!important}.pl-kos{color: #DE935F!important}.pl-kou{color: #DE935F!important}.pl-mai .pl-sf{color: #C66!important}.pl-mb{color: #B5BD68!important;font-weight: 700!important}.pl-mc{color: #B294BB!important}.pl-mh .pl-pdh{color: #DE935F!important}.pl-mi{color: #B294BB!important;font-style: italic!important}.pl-ml{color: #B5BD68!important}.pl-mm{color: #C66!important}.pl-mp{color: #81A2BE!important}.pl-mp1 .pl-sf{color: #81A2BE!important}.pl-mq{color: #DE935F!important}.pl-mr{color: #B294BB!important}.pl-ms{color: #B294BB!important}.pl-pdb{color: #B5BD68!important;font-weight: 700!important}.pl-pdc{color: #969896!important;font-style: italic!important}.pl-pdc1{color: #DE935F!important}.pl-pde{color: #DE935F!important}.pl-pdi{color: #B294BB!important;font-style: italic!important}.pl-pds{color: #B5BD68!important}.pl-pdv{color: #C66!important}.pl-pse{color: #DE935F!important}.pl-pse .pl-s2{color: #DE935F!important}.pl-s{color: #B294BB!important}.pl-s1{color: #B5BD68!important}.pl-s2{color: #c5c8c6!important}.pl-mp .pl-s3{color: #B294BB!important}.pl-s3{color: #81a2be!important}.pl-sc{color: #c5c8c6!important}.pl-scp{color: #DE935F!important}.pl-sf{color: #DAD085!important}.pl-smc{color: #F0C674!important}.pl-smi{color: #c5c8c6!important}.pl-smp{color: #c5c8c6!important}.pl-sok{color: #B294BB!important}.pl-sol{color: #B5BD68!important}.pl-som{color: #C66!important}.pl-sr{color: #C66!important}.pl-sra{color: #B294BB!important}.pl-src{color: #B294BB!important}.pl-sre{color: #B294BB!important}.pl-st{color: #B294BB!important}.pl-stj{color: #c5c8c6!important}.pl-stp{color: #DE935F!important}.pl-sv{color: #DE935F!important}.pl-v{color: #DE935F!important}.pl-vi{color: #DE935F!important}.pl-vo{color: #C66!important}.pl-vpf{color: #DE935F!important}.pl-mi1{color: #8F9D6A!important;background: rgba(0,64,0,.5)!important}.pl-mdht{color: #8F9D6A!important;background: rgba(0,64,0,.5)!important}.pl-md{color: #C66!important;background: rgba(64,0,0,.5)!important}.pl-mdhf{color: #C66!important;background: rgba(64,0,0,.5)!important}.pl-mdr{color: #DE935F!important;font-weight: 400!important}.pl-mdh{color: #C66!important;font-weight: 400!important}.pl-mdi{color: #C66!important;font-weight: 400!important}.pl-ib{background-color: #C66!important}.pl-id{background-color: #C66!important;color: #fff!important}.pl-ii{background-color: #C66!important;color: #fff!important}.pl-iu{background-color: #C66!important}.pl-mo{color: #c5c8c6!important}.pl-mri{color: #DE935F!important}.pl-ms1{background-color: #c5c8c6!important}.pl-va{color: #DE935F!important}.pl-vpu{color: #DE935F!important}.pl-entl{color: #c5c8c6!important}.CodeMirror-gutters{background: #222!important;border-right: 1px solid #484848!important}.CodeMirror-guttermarker{color: #fff!important}.CodeMirror-guttermarker-subtle{color: #aaa!important}.CodeMirror-linenumber{color: #aaa!important}.CodeMirror-cursor{border-left: 1px solid #fff!important}.CodeMirror-activeline-background{background: #27282E!important}.CodeMirror-matchingbracket{outline: 1px solid grey!important;color: #fff!important}.cm-keyword{color: #f9ee98!important}.cm-atom{color: #FC0!important}.cm-number{color: #ca7841!important}.cm-def{color: #8DA6CE!important}.cm-variable-2,span.cm-tag{color: #607392!important}.cm-variable-3,span.cm-def{color: #607392!important}.cm-operator{color: #cda869!important}.cm-comment{color: #777!important;font-style: italic!important;font-weight: 400!important}.cm-string{color: #8f9d6a!important}.cm-string-2{color: #bd6b18!important}.cm-meta{background-color: #141414!important;color: #f7f7f7!important}.cm-builtin{color: #cda869!important}.cm-tag{color: #997643!important}.cm-attribute{color: #d6bb6d!important}.cm-header{color: #FF6400!important}.cm-hr{color: #AEAEAE!important}.cm-link{color: #ad9361!important;font-style: italic!important;text-decoration: none!important}.cm-error{border-bottom: 1px solid red!important}#notebook .highlight table{background: #1d1f21!important;color: #c5c8c6!important}.highlight .hll{background-color: #373b41!important}.highlight .c{color: #969896!important}.highlight .err{color: #c66!important}.highlight .k{color: #b294bb!important}.highlight .l{color: #de935f!important}.highlight .h,.highlight .n{color: #c5c8c6!important}.highlight .o{color: #8abeb7!important}.highlight .p{color: #c5c8c6!important}.highlight .cm{color: #969896!important}.highlight .cp{color: #969896!important}.highlight .c1{color: #969896!important}.highlight .cs{color: #969896!important}.highlight .gd{color: #c66!important}.highlight .ge{font-style: italic!important}.highlight .gh{color: #c5c8c6!important;font-weight: 700!important}.highlight .gi{color: #b5bd68!important}.highlight .gp{color: #969896!important;font-weight: 700!important}.highlight .gs{font-weight: 700!important}.highlight .gu{color: #8abeb7!important;font-weight: 700!important}.highlight .kc{color: #b294bb!important}.highlight .kd{color: #b294bb!important}.highlight .kn{color: #8abeb7!important}.highlight .kp{color: #b294bb!important}.highlight .kr{color: #b294bb!important}.highlight .kt{color: #f0c674!important}.highlight .ld{color: #b5bd68!important}.highlight .m{color: #de935f!important}.highlight .s{color: #b5bd68!important}.highlight .na{color: #81a2be!important}.highlight .nb{color: #c5c8c6!important}.highlight .nc{color: #f0c674!important}.highlight .no{color: #c66!important}.highlight .nd{color: #8abeb7!important}.highlight .ni{color: #c5c8c6!important}.highlight .ne{color: #c66!important}.highlight .nf{color: #81a2be!important}.highlight .nl{color: #c5c8c6!important}.highlight .nn{color: #f0c674!important}.highlight .nx{color: #81a2be!important}.highlight .py{color: #c5c8c6!important}.highlight .nt{color: #8abeb7!important}.highlight .nv{color: #c66!important}.highlight .ow{color: #8abeb7!important}.highlight .w{color: #c5c8c6!important}.highlight .mf{color: #de935f!important}.highlight .mh{color: #de935f!important}.highlight .mi{color: #de935f!important}.highlight .mo{color: #de935f!important}.highlight .sb{color: #b5bd68!important}.highlight .sc{color: #c5c8c6!important}.highlight .sd{color: #969896!important}.highlight .s2{color: #b5bd68!important}.highlight .se{color: #de935f!important}.highlight .sh{color: #b5bd68!important}.highlight .si{color: #de935f!important}.highlight .sx{color: #b5bd68!important}.highlight .sr{color: #b5bd68!important}.highlight .s1{color: #b5bd68!important}.highlight .ss{color: #b5bd68!important}.highlight .bp{color: #c5c8c6!important}.highlight .vc{color: #c66!important}.highlight .vg{color: #c66!important}.highlight .vi{color: #c66!important}.highlight .il{color: #de935f!important}

</style>
<script src="https://gist.github.com/cfjedimaster/98d8c33940cbec9315e8e37b5b2726a9.js"></script>

In the script above, the tag island is how I wrote ad hoc text within a script context inside the `bx:savecontent` variable. In this case, I think it worked great. I started off with a multiline string instead, but since variables inside strings are interpolated, and since the # symbol is used for that, I had to double up my Markdown headers which made the code less readable. Although usually I'd imagine the input I'd be using would come from a database or some other source. GenAI APIs often return Markdown so this would be useful in that case for sure.

If you want to try this yourself, [install BoxLang](https://boxlang.ortusbooks.com/getting-started/installation) real quick and find the demos here: <https://github.com/ortus-boxlang/bx-demos/tree/master/java-interop>

p.s. In case you were curious, I switched to an embedded Gist for the last code sample as I couldn't figure out how to nicely escape the Markdown within the source. I'm sure I could (I tried backslash, it only half worked) but the Gist was easier.
