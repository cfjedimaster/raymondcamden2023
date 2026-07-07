# UI/UX Guide

I'm writing this as a reminder to myself on how to do certain things on my site, ie what shortcodes and such to use to render things, or other hacks.

## Gists or Markdown

{% mdwrap %}
markdown 
{% endmdwrap %}

This renders Markdown in a shadow dom which makes it standout from the rest of my site. There is an example, pre-shortcode, here: <https://www.raymondcamden.com/2026/07/03/building-custom-form-selection-boxes-working-on-accessibility>

## Callouts

{% callout %}
content
{% endcallout %}

Example: https://www.raymondcamden.com//2025/05/22/multimodal-support-in-chromes-built-in-ai

## Render PDFs

I'll come back to this. Fuck no to Adobe or Foxit. Most likely: https://www.embedpdf.com/
