-- table to store documents
create table documents (
  id serial primary key,
  content text not null,
  embedding extensions.vector(1536)
);

-- function to search documents table
create or replace function match_documents (
  query_embedding extensions.vector(1536),
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
  order by (documents.embedding <=> query_embedding) asc
  limit match_count;
$$;