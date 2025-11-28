# Create text embeddings

OpenAI Embeddings Model

- https://platform.openai.com/docs/guides/embeddings/what-are-embeddings

```bash
npm install dotenv openai
```

## Create OpenAI Client

```js
// index.js - could also put this in separate config.js module
import OpenAI from "openai";
import "dotenv/config";

/** Ensure the OpenAI API key is available and correctly configured */
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OpenAI API key is missing or invalid.");
}

/** OpenAI config */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

## Single Embedding

```js
async function main() {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: "Hello, world",
  });
  console.log("embeddings array: ", embedding.data[0].embedding);
}
main();
```

## Array of Embedding Pair Objects

```js
content = [...]

async function main(input) {
  await Promise.all( // wait for all to finish
    input.map( async(textChunk) => {
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: textChunk,
        });
        const data = { content: textChunk, embedding: embeddingResponse.data[0].embedding }
        console.log(data);
    })
  );
  console.log('Embedding complete!');
}

main(content);
```

<br />

# Set Up Vector DB

[Storing OpenAI embeddings in Postgres with pgvector](https://supabase.com/blog/openai-embeddings-postgres-vector)

## Setting up pgvector for Supabase

New project > Database > Extensions > search for "vector" > enable (with default schema "extensions")

## Integrate Supabase with project

> Get and add to .env:

SUPABASE_URL

- Method 1: Dashboard (Project Overview) > Project API Section
- Method 2: Project Settings > Data API > project url

SUPABASE_API_KEY

- Method 1: Dashboard (Project Overview) > Project API Section
- Method 2: Project Settings > API Keys > Legacy API Keys > anon public key

## Create Data Table

> Paste in Supabase SQL Editor:

```SQL
create table documents (
  id bigserial primary key,
  content text, -- corresponds to the "text chunk"
  embedding vector(1536) -- 1536 works for OpenAI embeddings
);
```

_Should see a table called "documents" in the "Table Editor" in sidebar_

# Store Vector Embeddings

## Set up Supabase Client

```js
// config.js
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

/** Supabase config */
const privateKey = process.env.SUPABASE_API_KEY;
if (!privateKey) throw new Error(`Expected env var SUPABASE_API_KEY`);
const url = process.env.SUPABASE_URL;
if (!url) throw new Error(`Expected env var SUPABASE_URL`);
export const supabase = createClient(url, privateKey);
```

## Set up Content

```js
// content.js
export default [
  "Name of Podcast (Duration): Description of podcast.",
  ...,
]
```

```js
// index.js
import podcasts from "./content.js";
```

## Insert embedding object into Supabase - ONE AT TIME

> KEY: Make sure embedding object fields match table columns, i.e. "content", "embeddding"

```js
async function main(input) { // input is the content array passed into main()
    await Promise.all(
        input.map( async (textChunk) => {
            const response = await openai.embeddings.create({...})
            const data = { content: ..., embedding: ...}

            // specify exact table and column names
            await supabase.from('documents').insert({
                content: textChunk,
                embedding: response.data[0].embedding
            })

            // OR simply
            await supabase.from('documents').insert(data)
    })
  );
  console.log('Embedding complete!');
}
```

## Insert embedding object into Supabase - SIMULTANEOUSLY

> Key changes:
- add return statement to map method
- return an array of objects each containing the content/embedding pairs

```js
async function main(input) { 

    const data = await Promise.all( // returns array of embedding objects after all Promises resolve
        input.map( async (textChunk) => {
            const response = await openai.embeddings.create({...})

            // Must RETURN the data object
            return { content: textChunk, embedding: response.data[0].embedding }
        })
    );

    // specify exact table and column names
    await supabase.from('documents').insert(data) // sends in single batch 

    console.log('Embedding and storing complete!');
}

main(podcasts)
```


# BASIC SETUP - Semantic & Similarity Search

[Querying a vector / embedding](https://supabase.com/docs/guides/ai/vector-columns)

## Process Overview

1. Generate embedding of query 

2. Create document search function in SQL Editor

2. Call function to compare query embedding to vectors in DB


## Create vector embedding representing query text

```js
// inside 'async function main(){...}'
const query = "Health and wellness tips for adults"

const response = await openai.embeddings.create({
  model: "text-embedding-ada-002",
  input: query,
})

const embedding = response.data[0].embedding;
```


## Create function to search DB table and Run in SQL Editor 

*table name must match exactly*

```sql
-- Run this in SQL Editor in Supabase
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.content,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
```

## Execute function using RPC Call to query Supabase for nearest vector match

```js
// inside 'async function main(){...}'
const { data } = await supabase.rpc('match_documents', {
  query_embedding: embedding,
  match_threshold: 0.50,
  match_count: 1
})
console.log(data[0].content, data[0].similarity)
```

## Manage multiple matches

```js
async function findNearestMatch(embedding) {
  const { data } = await supabase.rpc('match_movies', {
    query_embedding: embedding,
    match_threshold: 0.50,
    match_count: 4
  });
  
  // Manage multiple returned matches
  const match = data.map(obj => obj.content).join('\n');
  return match;
}
```


# ENHANCED - Create Conversational Responses from Similarity Search

```js
// Use OpenAI to make response converstaional
const chatMessages = [{
  role: "system",
  content: `You are an enthusiastic podcast expert who loves recommending podcasts to people. You will be given two pieces of information - some context about podcasts episodes and a question. Your main job is to formulate a short answer to the question using the provided context. If you are unsure and cannot find the answer in the context, say, "Sorry, I don't know the answer." Please do not make up the answer.`
}]

async function getChatCompletion(text, query) {
  chatMessages.push({
    role: 'user',
    content: `Context: ${text} Question: ${query}`
  })

  const response = openai.chat.completions.create({
    model: 'gpt-4.1-nano',
    messages: chatMessages,
    temperature: 0.5,
    frequency_penalty: 0.5
  })

  return response.choices[0].message.content
}
```

# Chunking Text From Documents

> Text embedding models have token limits, i.e. 'text-embedding-ada-002' ~= 5,500 words

> Splitting into chunks can also increase specificity

> Remove HTML tags, characters, and symbols before storing as vector

> Use library or framework for chunking text

> No perfect approach 
  - shorter chunks capture precise meanings but could miss wider context
  - longer chunks preserve more context but could provide too broad a scope
  - experiment with chunk-size and overlap to find balance between accuracy and context
  - optimize for smallest size without losing context 

## Use LangChain [CharacterTextSplitter](https://js.langchain.com/docs/how_to/character_text_splitter/)

```js
// index.js
import { CharacterTextSplitter } from "langchain/text_splitter";

// LangChain text splitter
async function splitDocument() {
  const response = await fetch('podcasts.txt')
  const text = await response.text() // returns file contents in one massive text chunk
  console.log(text)

  // Initiate text splitter - LangChain documentation (https://js.langchain.com/docs/how_to/character_text_splitter/)
  const textSplitter = new CharacterTextSplitter({
    separator: " ", // default is "\n\n" (separate paragraphs)
    chunkSize: 150, // maximum number a chunk can contain
    chunkOverlap: 15, // i.e. new chunk contains last 15 chars of previous; overlapping characters can help preserve semantic context between chunks
  });
  const output = await textSplitter.createDocuments([text]);
  console.log(output); // outputs array of objects each containig a chunk
  console.log(output[0]);
}

splitDocument()
```


## Use LangChain [RecursiveCharacterTextSplitter](https://js.langchain.com/docs/how_to/recursive_text_splitter/)

*This text splitter is the recommended one for generic text. It is parameterized by a list of characters. It tries to split on them in order until the chunks are small enough. The default list is ["\n\n", "\n", " ", ""]. This has the effect of trying to keep all paragraphs (and then sentences, and then words) together as long as possible, as those would generically seem to be the strongest semantically related pieces of text.*

### Example from Documentation

```js
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const text = `Hi.\n\nI'm Harrison.\n\nHow? Are? You?\nOkay then f f f f.
This is a weird text to write, but gotta test the splittingggg some how.\n\n
Bye!\n\n-H.`;
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 10,
  chunkOverlap: 1,
});

const output = await splitter.createDocuments([text]);

console.log(output.slice(0, 3));
```

```bash
[
  Document {
    pageContent: "Hi.",
    metadata: { loc: { lines: { from: 1, to: 1 } } }
  },
  Document {
    pageContent: "I'm",
    metadata: { loc: { lines: { from: 3, to: 3 } } }
  },
  Document {
    pageContent: "Harrison.",
    metadata: { loc: { lines: { from: 3, to: 3 } } }
  }
]
```

### In Our Code
```js
// index.js
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

// LangChain text splitter
async function splitDocument() {
  const response = await fetch('podcasts.txt')
  const text = await response.text() // returns file contents in one massive text chunk
  console.log(text)

  // Initiate text splitter - LangChain documentation (https://js.langchain.com/docs/how_to/character_text_splitter/)
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 150, // maximum number a chunk can contain
    chunkOverlap: 15, // i.e. new chunk contains last 15 chars of previous; overlapping characters can help preserve semantic context between chunks
  });
  const output = await textSplitter.createDocuments([text]);
  console.log(output); // outputs array of objects each containig a chunk
  console.log(output[0]);
}

splitDocument()
```

# Error Handling

```js
async function splitDocument(document) {
  try {
    const response = ...;
    // Check if fetch request was successful
    if (!response.ok) {
      throw new Error('Network response was not ok.');
    }
    
    const text = ...;
    const splitter = ...;
    const output = ...;
    return output;    
  } catch (e) {
      console.error('There was an issue with splitting text');
      throw e;
  }
}

async function createAndStoreEmbeddings() {
  try {
    const chunkData = ...;
    const data = ...;
    
    const { error } = await supabase.from('movies').insert(data);
    if (error) {
      throw new Error('Issue inserting data into the database.');
    }
    console.log('SUCCESS!');    
  } catch (e) {
      console.error('ERROR: ' + e.message);
  }
}
```


# Adding Conversation History

```js
const chatMessages = [{
    role: 'system',
    content: `You are an enthusiastic movie expert who loves recommending movies to people. You will be given two pieces of information - some context about movies and a question. Your main job is to formulate a short answer to the question using the provided context. If the answer is not given in the context, find the answer in the conversation history if possible. If you are unsure and cannot find the answer, say, "Sorry, I don't know the answer." Please do not make up the answer. Always speak as if you were chatting to a friend.` 
}];

async function getChatCompletion(text, query) {
  chatMessages.push({
    role: 'user',
    content: `Context: ${text} Question: ${query}`
  });
  
  const { choices } = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: chatMessages,
    temperature: 0.65,
    frequency_penalty: 0.5
  });
  chatMessages.push(choices[0].message);
  reply.innerHTML = choices[0].message.content;
}
```

