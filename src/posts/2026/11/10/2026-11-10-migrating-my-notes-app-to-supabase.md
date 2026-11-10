---
layout: post
title: "Migrating My Notes App to Supabase"
date: "2026-11-10T18:00:00"
categories: ["development"]
tags: ["javascript"]
banner_image: /images/banners/notes.jpg
permalink: /2026/11/10/migrating-my-notes-app-to-supabase
description: How I migrated my notes desktop app to the web with Supabase
---

Every now and then I put a service, API, framework, etc on my list of things to look at, and when I eventually get around to it, I wish I had made the time sooner. That's absolutely the case today. About two weeks ago I blogged about how I used [TinyJS](https://tinyjs.app/index.html) to build a desktop note application. This worked great and made use of a local SQLite database on the machine for storage. I was curious about how I'd migrate this to a "real" network based storage system that could be used in multiple places and tied to a particular account. I asked my AI agent (in this case, Claude, which I tend to use for all of my ad hoc questions about stuff) if [Supabase](https://supabase.com) would be an appropriate solution for this, and the response I got impressed the heck out of me. 

I knew Supabase was an online database system, and honestly, that's about all I knew. What I found out was it included a heck of a lot more. As just a high level overview, you get:

* A built-in REST API for your database. Like as soon as you've got a table, you can start using it remotely.
* Edge functions - which means you don't need to use another serverless system to set up webhooks or other features.
* An S3-compatible storage system for your binary files. Again - this just means you don't need to go elsewhere.
* Incredibly robust auth including support for SSO and row-based security. 

There's more, but that last bullet was the important part. I knew that migrating my app to enable users and such would require connecting notebooks and notes to one user, ensuring they can't mess with other people's data and so forth, and discovering that's "just a feature" of Supabase was freaking awesome.

While it's possible to do SSO with TinyJS (see [my post](https://www.raymondcamden.com/2026/10/12/adding-google-auth-to-tinyjs) on that topic), I decided for this iteration I'd set up a hosted web app. You *can* actually use TinyJS to wrap a web site and I may look into that later, but for now, this version lives on the web. 

## The Migration

For the migration itself, I pointed my agent at the existing TinyJS app and asked it to create a web version that made use of Google Auth and Supabase. Supabase has MCP support so I enabled that. The agent defined my initial table schema based on what I had used with SQLite. You can see the complete file [here](https://github.com/cfjedimaster/uninotesweb/blob/main/supabase/schema.sql) in the repo, but let me call out some interesting bits.

First off, here's the table creation for notebooks, which is the top level storage for your notes.

```
create table if not exists public.notebooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) > 0),
  created_at timestamptz not null default now()
);
```

All of this makes sense to me even with seeing some of this for the first time. There's a bit more for this table like indexes, but here's part of the security aspect:

```
revoke all on public.notebooks from anon;
grant select, insert, update, delete on public.notebooks to authenticated;

alter table public.notebooks enable row level security;

create policy "Users can view their own notebooks"
  on public.notebooks
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own notebooks"
  on public.notebooks
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
```

There's a bit more, but you get the idea. All of this ties into their [auth](https://supabase.com/docs/guides/auth) support in general, and their [social sign in](https://supabase.com/docs/guides/auth#social-sign-in) support in particular. I only worried about [Google auth](https://supabase.com/docs/guides/auth/social-sign-in/auth-google) support, but they've got a whole set of different SSO options. (Facebook and GitHub in particular will probably be useful.) You actually configure your application's oauth callback to go to Supabase and they handle the token exchange and such there, which then leads back to your application's code being able to CRUD data belonging to the current user.

Ok, to be honest, I simplified the *hell* out of the above, but what matters to me the most is that this is all baked in and my agent was literally able to set this all up in less than an hour. Now to be fair, my agent was going from a completely built and designed app using the web platform to an actual web page, so a lot was done already, but I was really impressed by how quick this came together.

On the front end, it makes use of Supabase's JavaScript client to simplify things as well. So for example, here's the call to get notebooks:

```js
export async function getNotebooks() {
  const client = requireClient()
  const { data, error } = await client
    .from('notebooks')
    .select('id, name, created_at, notes(count)')
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map(row => ({
    id: row.id,
    name: row.name,
    noteCount: Number(row.notes?.[0]?.count ?? 0)
  }))
}
```

I mentioned up top that there's a REST API automatically for your data. When I was playing around I created a simple note table (no users, just an id, title, and body), and you can see this for yourself here:

```
https://hqfgcffibrtfarzmpbhk.supabase.co/rest/v1/notes0?select=title,body,created_at&order=created_at.asc&limit=10
```

In that URL you see a few things in play:

* You can filter down the result to certain columns using `select`.
* You can sort.
* You can paginate.

I tied this to an API key that is connected to a policy with read only permissions. You pass that as an `apikey` header. Another cool thing related to pagination, if you pass a header named `Prefer` with the value `count=exact`, you get a header response giving you the size of your result set. I don't show filtering above, but you can absolutely filter based on text matches, so given that support plus the ability to ask for a size of the result, you could do proper paging as well. Again, all baked in!

The rest of the migration involved setting up a new OAuth client on the Google side (which I did by hand, uphill in the snow, both ways) and creating a site on Netlify (their MCP server made that easy). And you can see the final result here: <https://uninotes-web.netlify.app/>. Oh, I also did a basic marketing page cuz why not. The full source code is here: <https://github.com/cfjedimaster/uninotesweb/>

The last bit I'm going to add is search. Since Supabase supports [full text search](https://supabase.com/docs/guides/database/full-text-search), it should be relatively easy, and is one of my biggest gripes with OneNote. Another thing that kinda bugs me is that the app behaves like others where if you are logged in, you can't view the marketing page anymore. I may be the only one bothered by this, and a *lot* of places do this, but there's definitely times when I want to look at the marketing stuff even after I've logged in. 

Anyway, let me know what you think!