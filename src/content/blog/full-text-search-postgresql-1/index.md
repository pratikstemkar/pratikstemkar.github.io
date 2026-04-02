---
title: "Full Text Search in PostgreSQL - Part 1"
description: "From basic string matching to actually useful search"
date: "April 2 2026"
tags: ["database", "postgresql", "full-text-search", "database-internals"]
visible: true
references:
  - label: "PostgreSQL Documentation - Chapter 12 Full Text Search"
    url: "https://www.postgresql.org/docs/18/textsearch.html"
---

I was building a search feature where users could search through services and descriptions.

At first, I used `LIKE`. It felt simple and worked for basic cases.

But very quickly, issues started showing up. Searches were missing relevant results, sometimes returning too many useless ones, and there was no way to rank what should come first.

That’s when I looked into PostgreSQL Full Text Search.

---

## Why basic pattern matching breaks down

The problem with operators like `LIKE` or even regex is that they treat text as plain strings. There is no understanding of language.

If a user searches for “satisfy”, a document containing “satisfies” might not even show up. There is no normalization happening behind the scenes.

Another issue is relevance. Even if you get matches, every result is treated equally. A document that barely contains the word is ranked the same as one that heavily focuses on it.

On top of that, performance becomes a problem. These operators often end up scanning large portions of data because they are not designed for efficient search at scale.

Full Text Search is built to solve exactly these problems.

---

## What PostgreSQL considers a document

In PostgreSQL, a document is simply the text you want to search against. It could be a single column like a description, or a combination of fields like title and description joined together.

For example, imagine a table like this:

```sql
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  title TEXT,
  description TEXT
);
```

The important part is that PostgreSQL does not search this raw text directly. It first converts it into a structured format that is optimized for searching.

That format is called `tsvector`.

---

## How `tsvector` makes search smarter

When PostgreSQL converts a document into a `tsvector`, it does a lot of preprocessing.

The text is broken into tokens, normalized into lexemes, converted to lowercase, stripped of suffixes, and cleaned of stop words.

You can see this transformation directly:

```sql
SELECT to_tsvector('english', 'Bathroom cleaning services with deep sanitization');
```

This is what allows different forms of a word to match the same query. Words like “clean”, “cleaning”, and “cleaned” all reduce to a common representation.

Because of this normalization, search becomes much more accurate without requiring exact matches.

---

## Controlling importance within a document

Not all parts of a document are equally important. A match in the title usually matters more than a match in the description.

PostgreSQL lets you assign weights to reflect this.

```sql
SELECT 
  setweight(to_tsvector('english', title), 'A') ||
  setweight(to_tsvector('english', description), 'B')
FROM services;
```

This becomes important when we start ranking results.

---

## Turning user input into structured queries

On the query side, PostgreSQL uses `tsquery`, which is a structured representation of search input.

You *can* write it manually:

```sql
SELECT to_tsquery('english', 'bathroom & cleaning');
```

But in real applications, you should use helper functions.

For example:

```sql
SELECT *
FROM services
WHERE to_tsvector('english', description)
      @@ plainto_tsquery('english', 'bathroom cleaning');
```

This automatically converts the input into an AND query.

If you care about word order:

```sql
SELECT *
FROM services
WHERE to_tsvector('english', description)
      @@ phraseto_tsquery('english', 'bathroom cleaning');
```

And for real-world apps, the most practical option is:

```sql
SELECT *
FROM services
WHERE to_tsvector('english', description)
      @@ websearch_to_tsquery('english', '"bathroom cleaning" OR sanitization');
```

This behaves like a normal search engine and handles messy user input safely.

---

## Matching documents

Once both sides are processed, matching is done using the `@@` operator.

```sql
SELECT *
FROM services
WHERE to_tsvector('english', description)
      @@ plainto_tsquery('english', 'cleaning');
```

This checks whether a document satisfies the query.

---

## Ranking results in a meaningful way

Getting matches is not enough. You need to show the most relevant ones first.

PostgreSQL provides ranking functions for this.

```sql
SELECT *,
       ts_rank(
         to_tsvector('english', description),
         plainto_tsquery('english', 'bathroom cleaning')
       ) AS rank
FROM services
ORDER BY rank DESC;
```

If you combine this with weights:

```sql
SELECT *,
       ts_rank(
         setweight(to_tsvector('english', title), 'A') ||
         setweight(to_tsvector('english', description), 'B'),
         plainto_tsquery('english', 'cleaning')
       ) AS rank
FROM services
ORDER BY rank DESC;
```

Now matches in the title will rank higher than matches in the description.

---

## Highlighting search results

Once you have results, you usually want to show users why something matched.

PostgreSQL provides `ts_headline` for this:

```sql
SELECT ts_headline(
         'english',
         description,
         plainto_tsquery('english', 'bathroom cleaning')
       )
FROM services;
```

This extracts relevant fragments and highlights matching words.

If you are rendering this as HTML, make sure you sanitize the output to avoid XSS issues.

---

## A small note on performance

If you keep calling `to_tsvector` in every query, things will get slow.

Instead, you can store it:

```sql
ALTER TABLE services ADD COLUMN search_vector tsvector;

UPDATE services
SET search_vector =
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''));
```

Then query becomes much cleaner:

```sql
SELECT *
FROM services
WHERE search_vector @@ plainto_tsquery('english', 'cleaning');
```

We’ll take this further with indexing in Part 2.

---

## Conclusion

Full Text Search in PostgreSQL is not just a better version of `LIKE`. It changes how you think about search.

Instead of comparing raw strings, you are working with normalized language, structured queries, and ranked results.

That leads to better accuracy, better performance, and a much better user experience.

In the next part, we will go deeper into how this works in real systems. That includes indexing strategies like GIN and GiST, performance considerations, and patterns you can actually use in production.

That’s where Full Text Search starts to feel really powerful.
