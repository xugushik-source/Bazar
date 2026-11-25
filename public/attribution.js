// Where a visit came from. The storefront link mark (…/?src=instagram) wins; an ad or post tool that adds utm_source
// (…/?utm_source=instagram) is the fallback. Only a short lower-case code is kept, the same rule as src/sources.mjs,
// so anything else (spaces, personal data, long strings) is ignored and nothing personal is stored.
export const markRule=/^[a-z0-9_-]{2,32}$/;
export function sourceFromQuery(search){
 const p=new URLSearchParams(search||'');
 for(const key of ['src','utm_source']){const v=(p.get(key)||'').trim().toLowerCase();if(markRule.test(v))return v}
 return '';
}
