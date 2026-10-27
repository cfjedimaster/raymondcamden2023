---
layout: post
title: "Generating PDF Invoices from Word Templates with officeParser"
date: "2026-10-27T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/papers.jpg
permalink: /2026/10/27/generating-pdf-invoices-from-word-templates-with-officeparser
description: Using officeParser to generate dynamic PDFs
---

Last week I shared a demo (["Generating PDFs from Word Templates with officeParser"](https://www.raymondcamden.com/2026/10/17/generating-pdfs-from-word-templates-with-officeparser])) that made use of the awesome [officeParser](https://officeparser.harshankur.com/) open source library. That demo was a simple "customer report" web app that took custom data and a Word template. Once the form was submitted, the library converted tokens in the Word template to real data and output a PDF. I decided to build another demo using the library, this time on the server with a simple Node.js script.

As I mentioned previously, this new feature mimics Adobe's [Document Generation API](https://developer.adobe.com/document-services/docs/overview/document-generation-api/). At the time I wrote my blog post, the library just supported simple transformations. So given `{{ name }}` in your Word template, if you passed a name value of 'Ray', you would see that in the resulting PDF.

Now the library's been updated to support:

* Conditional logic
* Looping
* Formatting of values

Basically, and no shade to Adobe (not that I think they care), this open source library replicates the most of the same functionality, on your server, for free. 

Given these new features, I thought a simple "data invoicing system" would be a good demo. The idea being:

* You have data for invoices, usually in a database, but for me, just a JSON file.
* You have a Word template for the invoice.
* A script combines this together and spits out PDFs.

The first thing I built was the Word template. I used one of the built-in Word templates and modified it a bit. The screenshot below is from Word's online viewer which frankly looks pretty jank. In my desktop Word it looked a lot better:

<p>
<img src="https://static.raymondcamden.com/images/2026/10/word1.jpg" loading="lazy" alt="Word template" class="imgborder imgcenter">
</p>

In this template you can see the simple tokens but also an example of looping in the table using `for line in lineItems`. Also note the formatting on the dollar amounts. I could have found a way to get conditionals in, but figured this was interesting enough. 

My raw data is just JSON. Here's part of the file:

```json
{
  "invoices": [
    {
      "invoiceNumber": 100,
      "name": "Ada Lovelace",
      "email": "ada@example.com",
      "lineItems": [
        {
          "description": "Consulting",
          "quantity": 3,
          "unitCost": 150
        },
        {
          "description": "Travel expenses",
          "quantity": 1,
          "unitCost": 48.75
        }
      ]
    },
    {
      "invoiceNumber": 101,
      "name": "Grace Hopper",
      "email": "grace@example.com",
      "lineItems": [
        {
          "description": "Database review",
          "quantity": 2,
          "unitCost": 225
        }
      ]
    },
    {
      "invoiceNumber": 102,
      "name": "Katherine Johnson",
      "email": "katherine@example.com",
      "lineItems": [
        {
          "description": "Orbital trajectory analysis",
          "quantity": 2,
          "unitCost": 310
        },
        {
          "description": "Technical review",
          "quantity": 3,
          "unitCost": 85.5
        },
        {
          "description": "Project meeting",
          "quantity": 1,
          "unitCost": 120
        }
      ]
    },
    {
      "invoiceNumber": 103,
      "name": "Alan Turing",
      "email": "alan@example.com",
      "lineItems": [
        {
          "description": "Systems consulting",
          "quantity": 4,
          "unitCost": 175
        },
        {
          "description": "Prototype review",
          "quantity": 2,
          "unitCost": 240
        },
        {
          "description": "Documentation",
          "quantity": 6,
          "unitCost": 42.5
        },
        {
          "description": "Materials",
          "quantity": 1,
          "unitCost": 63.25
        }
      ]
    }
  ]
}
```

And finally, here's the script that does the processing:

```js
const { readFile, mkdir, writeFile } = require('node:fs/promises')
const path = require('node:path')
const { OfficeConverter, OfficeTemplate } = require('officeparser')

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function requireText(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} must be a non-empty string.`)
  }

  return value.trim()
}

function toCents(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative number.`)
  }

  const cents = Math.round((value + Number.EPSILON) * 100)
  if (!Number.isSafeInteger(cents)) {
    throw new Error(`${label} is too large to represent as currency.`)
  }

  return cents
}

function buildInvoiceData(json, issuedOn = new Date()) {
  if (!isRecord(json) || !Array.isArray(json.invoices) || json.invoices.length === 0) {
    throw new Error('The JSON file must contain a non-empty "invoices" array.')
  }

  const invoiceDate = [
    issuedOn.getFullYear(),
    String(issuedOn.getMonth() + 1).padStart(2, '0'),
    String(issuedOn.getDate()).padStart(2, '0'),
  ].join('-')

  return json.invoices.map((invoice, invoiceIndex) => {
    const invoiceLabel = `Invoice ${invoiceIndex + 1}`
    if (!isRecord(invoice)) {
      throw new Error(`${invoiceLabel} must be an object.`)
    }

    if (!Number.isSafeInteger(invoice.invoiceNumber) || invoice.invoiceNumber <= 0) {
      throw new Error(`${invoiceLabel} invoiceNumber must be a positive whole number.`)
    }

    const recipientName = requireText(invoice.name, `${invoiceLabel} name`)
    const recipientEmail = requireText(invoice.email, `${invoiceLabel} email`)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      throw new Error(`${invoiceLabel} email must be a valid email address.`)
    }
    if (!Array.isArray(invoice.lineItems) || invoice.lineItems.length === 0) {
      throw new Error(`${invoiceLabel} must contain at least one line item.`)
    }

    let subtotalCents = 0
    const lineItems = invoice.lineItems.map((item, itemIndex) => {
      const itemLabel = `${invoiceLabel} line item ${itemIndex + 1}`
      if (!isRecord(item)) {
        throw new Error(`${itemLabel} must be an object.`)
      }

      const description = requireText(item.description, `${itemLabel} description`)
      if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
        throw new Error(`${itemLabel} quantity must be a positive whole number.`)
      }

      const unitCostCents = toCents(item.unitCost, `${itemLabel} unitCost`)
      const lineTotalCents = unitCostCents * item.quantity
      if (!Number.isSafeInteger(lineTotalCents) || !Number.isSafeInteger(subtotalCents + lineTotalCents)) {
        throw new Error(`${itemLabel} total is too large to represent as currency.`)
      }
      subtotalCents += lineTotalCents

      return {
        description,
        quantity: item.quantity,
        unitCost: unitCostCents / 100,
        total: lineTotalCents / 100,
        lineTotal: lineTotalCents / 100,
      }
    })

    const invoiceNumber = String(invoice.invoiceNumber)
    const salesTaxCents = Math.round(subtotalCents / 20)
    const totalCents = subtotalCents + salesTaxCents
    if (!Number.isSafeInteger(totalCents)) {
      throw new Error(`${invoiceLabel} total due is too large to represent as currency.`)
    }

    return {
      invoiceNumber,
      invoiceDate,
      recipientName,
      recipientEmail,
      lineItems,
      subtotal: subtotalCents / 100,
      salesTax: salesTaxCents / 100,
      total: totalCents / 100,
    }
  })
}

function makeFilename(invoice) {
  const customerSlug = invoice.recipientName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'customer'

  return `${invoice.invoiceNumber.toLowerCase()}-${customerSlug}.pdf`
}

async function generateInvoices(inputPath, outputPath, templatePath) {
  const input = JSON.parse(await readFile(inputPath, 'utf8'))
  const invoices = buildInvoiceData(input)
  const template = await readFile(templatePath)

  await mkdir(outputPath, { recursive: true })

  const renderedDocuments = await OfficeTemplate.render(template, {
    data: invoices,
    onMissing: 'error',
  })
  if (!Array.isArray(renderedDocuments) || renderedDocuments.length !== invoices.length) {
    throw new Error('officeparser did not return one rendered document per invoice.')
  }

  for (const [index, invoice] of invoices.entries()) {
    const renderedDocx = renderedDocuments[index]
    if (!(renderedDocx instanceof Uint8Array)) {
      throw new Error(`officeparser did not return a rendered document for ${invoice.invoiceNumber}.`)
    }

    const { value: pdfBytes } = await OfficeConverter.convert(renderedDocx, 'pdf', {
      generatorConfig: {
        pdfConfig: { engine: 'native' },
      },
    })

    if (!(pdfBytes instanceof Uint8Array)) {
      throw new Error(`officeparser did not return PDF data for ${invoice.invoiceNumber}.`)
    }

    const outputFile = path.join(outputPath, makeFilename(invoice))
    await writeFile(outputFile, pdfBytes)
    console.log(`Created ${outputFile}`)
  }
}

async function main(args) {
  if (args[0] === '--help' || args[0] === '-h') {
    console.log('Usage: node script.js [invoices.json] [output-directory]')
    return
  }
  if (args.length > 2) {
    throw new Error('Usage: node script.js [invoices.json] [output-directory]')
  }

  const inputPath = args[0]
    ? path.resolve(args[0])
    : path.join(__dirname, 'invoices.json')
  const outputPath = args[1]
    ? path.resolve(args[1])
    : path.join(__dirname, 'output')
  const templatePath = path.join(__dirname, 'invoiceTemplate.docx')

  await generateInvoices(inputPath, outputPath, templatePath)
}

if (require.main === module) {
  main(process.argv.slice(2)).catch((error) => {
    console.error('Invoice generation failed:', error)
    process.exitCode = 1
  })
}

module.exports = { buildInvoiceData, generateInvoices, makeFilename }
```

It can be run at the CLI and takes arguments for where the data is and where to write it out - along with basic defaults for each. `buildInvoiceData` does the job of mapping the 'raw' data to what I need for the operation. This is something I did with Adobe's APIs as well. Rarely was the source data in a shape that mapped directly to the Word template, so a bit of shaping handles that transformation. 

The officeParser library part is here:

```js
const renderedDocuments = await OfficeTemplate.render(template, {
	data: invoices,
	onMissing: 'error',
})
```

That second arg is interesting. If the Word template references a value you don't pass, you can have the library simply ignore it, or throw an error. I like throwing an error as it makes it obvious when you've screwed something up. 

After the conversion is done, the bits are all saved out to PDFs using the invoice number and name of the person getting the invoice.

There's a bit more to the script above, but the gist is - read the data, shape it, pass it along with the template, save the result.

Here's an example of how one looks:

{% embedPDF "pdf-viewer-1", "https://static.raymondcamden.com/images/2026/10/106-radia-perlman.pdf" %}

Pretty cool, right? I mean, we all agree, PDFs are REALLY COOL! Anyway, you can grab all the bits, along with the Word template and sample output here: <https://github.com/cfjedimaster/webdemos/tree/master/officeparser/invoice>