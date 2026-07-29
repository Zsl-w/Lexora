import type { AcademicSource, DomainPreference } from '../shared/types';

const compact = (value: string, max: number) => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const xml = (value: string, tag: string, max: number) => compact(value.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'))?.[1] || '', max);
const xmlAll = (value: string, tag: string, max: number) => [...value.matchAll(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'gi'))].map((match) => compact(match[1], max)).filter(Boolean);

function queryTerm(term: string, context: string) {
  const clean = term.replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
  if (/^[A-Z][A-Z0-9-]{1,7}$/.test(clean)) {
    const contextWords = [...new Set((context.match(/[A-Za-z][A-Za-z0-9-]{3,}/g) || []).map((word) => word.toLowerCase()))].slice(0, 5).join(' ');
    return `${clean} ${contextWords}`.trim();
  }
  return clean;
}

function arxivIds(term: string) {
  const normalized = term.toLowerCase();
  if (/\btransformers?\b/.test(normalized)) return ['1706.03762', '2106.04554'];
  if (/\brag\b|retrieval[- ]augmented generation/.test(normalized)) return ['2005.11401'];
  if (/\bbert\b/.test(normalized)) return ['1810.04805'];
  if (/\bdiffusion models?\b/.test(normalized)) return ['2006.11239'];
  return [];
}

export async function searchArxiv(term: string): Promise<AcademicSource[]> {
  const query = queryTerm(term, '');
  const ids = arxivIds(query).map((id) => `id:${id}`);
  const search = query ? [`ti:"${query}"`, `abs:"${query}"`] : [];
  const url = new URL('https://export.arxiv.org/api/query');
  url.searchParams.set('search_query', `(${[...ids, ...search].join(' OR ')}) AND (cat:cs.AI OR cat:cs.CL OR cat:cs.LG OR cat:cs.CV OR cat:cs.IR OR cat:stat.ML)`);
  url.searchParams.set('start', '0'); url.searchParams.set('max_results', '6'); url.searchParams.set('sortBy', 'relevance');
  try {
    const response = await fetch(url, { headers: { Accept: 'application/atom+xml' } });
    if (!response.ok) return [];
    return [...(await response.text()).matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].flatMap((match, index) => {
      const entry = match[1]; const idUrl = xml(entry, 'id', 300); const identifier = idUrl.match(/\/abs\/([^/?#]+)/i)?.[1];
      const title = xml(entry, 'title', 360); const abstract = xml(entry, 'summary', 1800);
      if (!identifier || !title || !abstract) return [];
      const year = Number(xml(entry, 'published', 20).slice(0, 4)) || null;
      const category = entry.match(/<arxiv:primary_category\s+term="([^"]+)"/i)?.[1] || null;
      return [{ id: index + 1, provider: 'arxiv' as const, identifier: `arXiv:${identifier}`, title, authors: [...entry.matchAll(/<author>([\s\S]*?)<\/author>/gi)].map((author) => xml(author[1], 'name', 100)).filter(Boolean).slice(0, 3), year, venue: category ? `arXiv · ${category}` : 'arXiv', url: `https://arxiv.org/abs/${identifier}`, abstract }];
    }).slice(0, 4);
  } catch { return []; }
}

export async function searchPubMed(term: string, context: string): Promise<AcademicSource[]> {
  const search = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi');
  search.searchParams.set('db', 'pubmed'); search.searchParams.set('retmode', 'json'); search.searchParams.set('retmax', '6'); search.searchParams.set('sort', 'relevance'); search.searchParams.set('term', queryTerm(term, context)); search.searchParams.set('tool', 'Lexora');
  try {
    const ids = ((await (await fetch(search)).json()) as { esearchresult?: { idlist?: string[] } }).esearchresult?.idlist?.filter((id) => /^\d+$/.test(id)).slice(0, 6) || [];
    if (!ids.length) return [];
    const fetchUrl = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi'); fetchUrl.searchParams.set('db', 'pubmed'); fetchUrl.searchParams.set('retmode', 'xml'); fetchUrl.searchParams.set('id', ids.join(',')); fetchUrl.searchParams.set('tool', 'Lexora');
    const response = await fetch(fetchUrl); if (!response.ok) return [];
    return [...(await response.text()).matchAll(/<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/gi)].flatMap((match, index) => {
      const article = match[1]; const pmid = xml(article, 'PMID', 20); const title = xml(article, 'ArticleTitle', 360); const abstract = xmlAll(article, 'AbstractText', 900).join(' ').slice(0, 1800);
      if (!pmid || !title || !abstract) return [];
      const authorBlocks = [...article.matchAll(/<Author(?:\s[^>]*)?>([\s\S]*?)<\/Author>/gi)];
      const authors = authorBlocks.map((author) => [xml(author[1], 'ForeName', 60), xml(author[1], 'LastName', 80)].filter(Boolean).join(' ')).filter(Boolean).slice(0, 3);
      const year = Number((xml(article, 'Year', 8) || xml(article, 'MedlineDate', 20)).match(/\b(?:18|19|20|21)\d{2}\b/)?.[0]) || null;
      return [{ id: index + 1, provider: 'pubmed' as const, identifier: `PMID:${pmid}`, title, authors, year, venue: xml(article, 'ISOAbbreviation', 160) || xml(article, 'Title', 160) || null, url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`, abstract }];
    }).slice(0, 4);
  } catch { return []; }
}

export async function searchCrossref(term: string, context: string): Promise<AcademicSource[]> {
  const url = new URL('https://api.crossref.org/works'); url.searchParams.set('query.bibliographic', queryTerm(term, context)); url.searchParams.set('rows', '8'); url.searchParams.set('select', 'DOI,title,author,published,container-title,URL,abstract');
  try {
    const payload = (await (await fetch(url, { headers: { Accept: 'application/json' } })).json()) as { message?: { items?: Array<Record<string, unknown>> } };
    return (payload.message?.items || []).flatMap((item, index) => {
      const doi = typeof item.DOI === 'string' ? item.DOI : ''; const title = Array.isArray(item.title) && typeof item.title[0] === 'string' ? compact(item.title[0], 360) : '';
      if (!doi || !title) return [];
      const authors = Array.isArray(item.author) ? item.author.flatMap((author) => typeof author === 'object' && author ? [[(author as { given?: string }).given, (author as { family?: string }).family].filter(Boolean).join(' ')] : []).filter(Boolean).slice(0, 3) : [];
      const parts = (item.published as { 'date-parts'?: number[][] } | undefined)?.['date-parts']; const year = Array.isArray(parts?.[0]) ? parts[0][0] || null : null;
      const venue = Array.isArray(item['container-title']) && typeof item['container-title'][0] === 'string' ? item['container-title'][0] : null;
      return [{ id: index + 1, provider: 'crossref' as const, identifier: doi, title, authors, year, venue, url: `https://doi.org/${encodeURIComponent(doi)}`, abstract: typeof item.abstract === 'string' ? compact(item.abstract, 1800) : null }];
    }).slice(0, 4);
  } catch { return []; }
}

export async function retrieveSources(term: string, context: string, preference: DomainPreference): Promise<AcademicSource[]> {
  const primary = preference === 'medicine' ? await searchPubMed(term, context) : preference === 'ai' ? await searchArxiv(term) : [];
  if (primary.length) return primary.map((source, index) => ({ ...source, id: index + 1 }));
  return (await searchCrossref(term, context)).map((source, index) => ({ ...source, id: index + 1 }));
}
