---
layout: post
title: "Gemini File Search and File Stores for Easy RAG"
date: "2025-11-17T18:00:00"
categories: ["development"]
tags: ["generative ai","python"]
banner_image: /images/banners/red_storage.jpg
permalink: /2025/11/17/gemini-file-search-file-stores-for-easy-rag
description: How to use Gemini's new File Search / File Store APIs
---

I am *really* excited about this post as it's one of the most powerful changes I've seen to Google's [Gemini APIs](https://ai.google.dev/) in quite some time. For a while now it's been really easy to perform searches against a document, or a group of documents. You would upload the file (or files), ask your questions, and that was all you needed. 

However, the files you uploaded were only there temporarily. This was fine for processes like summarization or categorization where you could automate the process and be done with it. This was also fine for basic chat uses. I blogged an example of this last month: ["Building a Document Q&A System with Google Gemini"](https://www.raymondcamden.com/2025/10/02/building-a-document-qa-system-with-google-gemini). 

The new features I'm talking about today change all of that. You can now create permanent collections of files for introspection over time, creating a real RAG (retrieval augmented generation) system in a few minutes. Well, a simple one at least. Let's see how.

## File Stores 

Gemini's new RAG support is centered around File Store. A File Store is simply a collection of documents. The APIs provide full control over them by letting you create, read, update, and delete. Files can be uploaded directly to a store, or you can use the "old" API for uploading files and then import it into a store. Within an existing store you can also get a list of files and add or delete. I don't believe you can "edit" a file and would need to delete and re-upload instead, but overall, you can pretty much do anything here - and do it rather simply. I'll be showing code for this in a minute. 

That's the good part. The bad part? Well, it's not really bad per se, but the actual *how* of what you do with them is going to be really different based on every different application you build. I can see many different scenarios:

* Your developer could build a script that simply checks to see if a store has been created, and if not, makes it. It then reads a folder and uploads each file. This could be run "by hand" once at the beginning of a project.
* You could automate that process and on a schedule, see if new files need to be added, or removed from the store.
* You could build a web interface that lets your business users work with one file store, adding and removing files as they see fit.
* You could build a web interface that lets you build multiple file stores and work with them.

That's just a few examples, but you get the idea. The actual API is going to be trivial, *minutes* of work probably. Actually figuring out what makes sense for your application/organization will probably take much more time. 

Ok, code time. For my demo, I'm going to search against a collection of Shakespeare's works. (Initially I had a copy of everything he wrote, but I removed a bunch to help speed up testing.) My code is going to do the following:

* Ask Gemini for a list of my file stores.
* See if one exists with a particular name.
* If not, make it
* Then iterate over every file and upload it.

I started off my template with some imports, and a constant value for my store name and source directory:

```python
from google import genai
from google.genai import types
import time
import os 
import sys

# Defines the name of our store
STORE = "Shakespeare Works"

# Defines where our content is
SOURCE = "./source_pdfs"

# Maximum wait time for operations (in seconds)
MAX_OPERATION_WAIT = 300  # 5 minutes

client = genai.Client()
```

Next, I see if the store already exists.

```python
# Step One - do we have our store? We can't search by display name, so need to get all and check
file_search_store = None
for store in client.file_search_stores.list():
    if store.display_name == STORE:
        file_search_store = store
        print(f"Found existing store at {file_search_store.name}")
        print(f"Total docs: {file_search_store.active_documents_count}")
        sys.exit()
```

Note that I print out how many docs are in the store. I don't really need that, but it's a good sanity check. Now I create the store:

```python
if file_search_store is None:
    print("Store not found. Creating new store...")
    try:
        # Create the store...
        file_search_store = client.file_search_stores.create(config={'display_name': STORE})
        print(f"Store created: {file_search_store.name}")
    except Exception as e:
        print(f"Error creating store: {e}")
        sys.exit()
```

The `name` value I print here is a unique ID. I'll copy that down and use it later. Now I scan the folder and ensure I've got some PDFs:

```python
# Validate source directory exists
if not os.path.exists(SOURCE):
    print(f"Error: Source directory '{SOURCE}' does not exist")
    sys.exit()

# List the pdfs...
pdfs = [f for f in os.listdir(SOURCE) if f.lower().endswith('.pdf') and os.path.isfile(os.path.join(SOURCE, f))]

if not pdfs:
    print(f"No PDF files found in {SOURCE}")
    sys.exit()

print(f"Found {len(pdfs)} PDF file(s) to upload")
```

And finally, I upload each one. For this, the [documentation](https://ai.google.dev/gemini-api/docs/file-search) was super useful. Document processing is async, so for each upload I wait until it's done. This is also I do something import - add metadata.

In general, you will probably ask questions about your file store as a whole, but what if you want to work with a specific document, or set of documents? For example, an e-commerce store that sells products may want to put their manuals online in one store, and use metadata to separate products into categories, or perhaps price ranges. You can use *any* logic you want here. In my case, I want to allow a search against a specific piece of work so I'm going to store the filename in metadata. Another option would be to use a PDF parsing library to get the PDF's document title instead, but the filename is enough for now.

```python
# Upload each
for pdf in pdfs: 
    print(f"Handling {pdf}")
    try:
        operation = client.file_search_stores.upload_to_file_search_store(
            file=os.path.join(SOURCE, pdf),
            file_search_store_name=file_search_store.name,
            config={
                'display_name': pdf,            
                'custom_metadata': [
                    {'key': 'filename', 'string_value': pdf}
                ]
            },
        )

        # Wait until import is complete with timeout
        start_time = time.time()
        while not operation.done:
            elapsed = time.time() - start_time
            if elapsed > MAX_OPERATION_WAIT:
                print(f"Timeout waiting for {pdf} to upload")
                break
            time.sleep(5)
            operation = client.operations.get(operation)
        
        
        if operation.done:
            print(f"  ✓ Successfully uploaded {pdf}")
        else:
            print(f"  ✗ Upload incomplete for {pdf}")
            
    except Exception as e:
        print(f"  ✗ Error uploading {pdf}: {e}")
```

And that's it - the last thing I do is simply output a completed message:

```python
print(f"\nStore setup complete. Store: {file_search_store.name}")
```

I'll share a link to all the code at the end so you can grab the entire file if you want. In my testing, each upload took maybe 10 or so seconds, which isn't bad I think, but keep that in mind if you have hundreds or thousands of documents.

## Working with the Store

Alright, at this point, I've got a store. I copied out the name so I could use it again. To work with the store, all I need to do then is use the `FileSearch` tool in my `generate_content` call. It is ridiculously simple:

```python
from google import genai
from google.genai import types

# Defines the name of our store
STORE_NAME = "fileSearchStores/shakespeare-works-b5zezkvl23pb"

client = genai.Client()

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="What are the range of themes in these works?",
    config=types.GenerateContentConfig(
        tools=[types.Tool(
            file_search=types.FileSearch(
                  file_search_store_names=[STORE_NAME]
            )
        )]
    )
)

print(response.text)
```

Here's the result, and keep in mind this is about half of Shakespeare's works. 

```
The works presented cover a range of themes, often with a comedic and 
romantic focus.

A prominent theme is **mistaken identity**, particularly seen in 
"The Comedy of Errors," which revolves around the farcical misadventures 
of two sets of identical twins causing widespread confusion until their 
eventual reunion. This play also explores **family separation and reunion**.

**Love and romantic entanglements** are central to "A Midsummer 
Night's Dream" and "As You Like It." "A Midsummer Night's Dream" 
delves into the complexities of love, showcasing how it can be 
manipulated by magic and lead to unexpected pairings among young 
Athenians, ultimately resolving their romantic tangles. This play 
also incorporates themes of **magic and the supernatural**, as 
residents of Athens interact with fairies.

"As You Like It" features **witty words and romance** against a 
backdrop of **family disputes** and **exile**. It explores themes 
of **assumed identity and disguise**, as Rosalind takes on a male 
persona in the Forest of Arden, and culminates in multiple weddings 
and reconciliations. The play also touches upon the philosophical 
theme of the **stages of human life**, famously articulated in 
the "All the world's a stage" monologue.

Across these works, common threads include:
*   The transformative power of different environments, such as the Forest of Arden.
*   The resolution of conflicts leading to happy conclusions.
*   The interplay of reality and illusion.
*   The enduring power and often confusing nature of love.
```

That's a pretty good response. Even better, I could modify my code to support [citations](https://ai.google.dev/gemini-api/docs/file-search#citations) as well to help provide even more confidence in the results.

To search against a subset of the store, I can pass a metadata filter:

```python
from google import genai
from google.genai import types

# Defines the name of our store
STORE_NAME = "fileSearchStores/shakespeare-works-b5zezkvl23pb"

client = genai.Client()

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Who are the main characters?",
    config=types.GenerateContentConfig(
        tools=[types.Tool(
            file_search=types.FileSearch(
                  file_search_store_names=[STORE_NAME],
                  metadata_filter = 'filename = "romeo-and-juliet_PDF_FolgerShakespeare.pdf"'
            )
        )]
    )
)

print(response.text)
```

This returns:

```
The main characters in the play "Romeo and Juliet" are Romeo and 
Juliet themselves. The prologue refers to them as "star-crossed 
lovers."

Other significant characters include:
*   **Romeo's family:** Montague (his father), Lady Montague 
(his mother), Benvolio (their kinsman), Abram (a Montague 
servingman), and Balthasar (Romeo's servingman).
*   **Juliet's family:** Capulet (her father), Lady Capulet (her 
mother), Nurse to Juliet, Tybalt (kinsman to the Capulets), 
Petruchio (Tybalt's companion), Capulet's Cousin, Sampson, 
Gregory, Peter, and other servingmen.
*   **Other notable characters:** Escalus (Prince of Verona), 
Paris (the Prince's kinsman and Juliet's suitor), Mercutio 
(the Prince's kinsman and Romeo's friend), Paris' Page, Friar 
Lawrence, Friar John, Apothecary, Citizens, Musicians, Watchmen, 
and Chorus.
```

## Some Final Notes

As I said, I *really* love this feature, but there's a few things to note before you start playing. 

Make note of the list of [support files](https://ai.google.dev/gemini-api/docs/file-search#supported-files). It is quite extensive, but does not cover images or audio. You'll have to use the previous method of uploading into temporary storage to work with them. In *theory* you could convert images to PDFs and that would give you basic support for that. 

Next, make note of the [rate limits](https://ai.google.dev/gemini-api/docs/file-search#rate-limits), which tells you the max file size (100 MB) as well as the total size of the store which depends on what price tier you're on. 

Finally, check out the [pricing](https://ai.google.dev/gemini-api/docs/file-search#pricing). The best part there is that storage is free. Woot. 

You can find all my demo files here: <https://github.com/cfjedimaster/ai-testingzone/tree/main/stores_test>. As always, let me know what you think!

Photo by <a href="https://unsplash.com/@joshstyle?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">JOSHUA COLEMAN</a> on <a href="https://unsplash.com/photos/purple-shutter-doors-ZVkDLrXGMdw?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
      