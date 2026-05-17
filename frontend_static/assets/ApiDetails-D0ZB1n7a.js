import{m as L,n as k,o as O,p as B,q as D,s as z,v as J,r as N,c as U,d as F,t as K,S as M,j as e,N as b,C as d,e as u,B as p,L as $,F as S,f as m,h as _,l as R,i as h,k as x,w as I}from"./index-BAAE5dBP.js";import{A as X,H as Y,a as G,M as A,S as V}from"./ApiVaultBadges-DtY3mu16.js";import{E as W}from"./eye-IFUkccT7.js";import{E as Q,B as Z}from"./external-link-CogW1Rmr.js";import{C as ee}from"./check-EPkHgKDH.js";import{C as se}from"./copy-hU4shYjB.js";import"./triangle-alert-BO1zoipS.js";import"./circle-check-BIMjIpeR.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ae=L("Star",[["path",{d:"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",key:"r04s7s"}]]),re={rapidapi_proxy:"دروازه اختصاصی IranAPI",api_key:"کلید API اختصاصی",none:"دسترسی عمومی"},te={draft:"پیش‌نویس",ready:"آماده فعال‌سازی",published:"فعال در IranAPI",deprecated:"بازنشسته"},ne={Authorization:"Bearer <IRANAPI_API_KEY>","X-IranAPI-Client":"<CLIENT_ID>","Content-Type":"application/json"};function ie(r){return r.includes("speech")?{path:"/speech/transcriptions",payload:{audio_url:"https://cdn.example.com/audio/sample-fa.wav",language:"fa-IR",diarization:!0}}:r.includes("payment")?{path:"/payments/verify",payload:{transaction_id:"txn_123456789",amount:25e4,currency:"IRR"}}:r.includes("geo")?{path:"/routes/optimize",payload:{origin:{lat:35.7219,lng:51.3347},destination:{lat:35.6892,lng:51.389},mode:"driving"}}:{path:"/requests",payload:{query:"sample request",locale:"fa-IR"}}}function oe(r,n){return`${r.replace(/\/+$/,"")}${n}`}function T(r,n=2){return JSON.stringify(r,null,n)}function ce(r){if(!r.base_url)return[];const{path:n,payload:c}=ie(r.slug),s=oe(r.base_url,n),i=r.rapidapi.public_auth_scheme==="rapidapi_proxy"||r.rapidapi.public_auth_scheme==="api_key",g=i?ne:{"Content-Type":"application/json"},l=T(g,2),o=T(c,2),j=JSON.stringify(c);return[{id:"curl",label:"cURL",code:`curl --request POST \\
  --url '${s}' \\
  ${i?`--header 'Authorization: Bearer <IRANAPI_API_KEY>' \\
  --header 'X-IranAPI-Client: <CLIENT_ID>' \\
  `:""}--header 'Content-Type: application/json' \\
  --data '${j}'`},{id:"javascript",label:"JavaScript",code:`const response = await fetch("${s}", {
  method: "POST",
  headers: ${l},
  body: JSON.stringify(${o}),
});

if (!response.ok) {
  throw new Error(\`IranAPI request failed: \${response.status}\`);
}

const data = await response.json();
console.log(data);`},{id:"typescript",label:"TypeScript",code:`type IranApiResponse = Record<string, unknown>;

const payload = ${o} satisfies Record<string, unknown>;

const response = await fetch("${s}", {
  method: "POST",
  headers: ${l},
  body: JSON.stringify(payload),
});

if (!response.ok) {
  throw new Error(\`IranAPI request failed: \${response.status}\`);
}

const data = (await response.json()) as IranApiResponse;
console.log(data);`},{id:"python",label:"Python",code:`import requests

url = "${s}"
headers = ${JSON.stringify(g,null,4)}
payload = ${JSON.stringify(c,null,4)}

response = requests.post(url, json=payload, headers=headers, timeout=30)
response.raise_for_status()

print(response.json())`},{id:"node",label:"Node.js",code:`import axios from "axios";

const { data } = await axios.post(
  "${s}",
  ${o},
  {
    headers: ${l},
    timeout: 30000,
  },
);

console.log(data);`},{id:"php",label:"PHP",code:`<?php
$url = "${s}";
$payload = ${JSON.stringify(c,null,2)};

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
${i?`        "Authorization: Bearer <IRANAPI_API_KEY>",
        "X-IranAPI-Client: <CLIENT_ID>",
`:""}        "Content-Type: application/json",
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
]);

$response = curl_exec($ch);
if ($response === false) {
    throw new RuntimeException(curl_error($ch));
}

curl_close($ch);
echo $response;`},{id:"go",label:"Go",code:`package main

import (
  "bytes"
  "encoding/json"
  "fmt"
  "net/http"
)

func main() {
  payload := map[string]any${JSON.stringify(c,null,2).replace(/"([^"]+)":/g,'"$1":').replace(/true/g,"true").replace(/false/g,"false")}

  body, _ := json.Marshal(payload)
  req, _ := http.NewRequest("POST", "${s}", bytes.NewReader(body))
${i?`  req.Header.Set("Authorization", "Bearer <IRANAPI_API_KEY>")
  req.Header.Set("X-IranAPI-Client", "<CLIENT_ID>")
`:""}  req.Header.Set("Content-Type", "application/json")

  res, err := http.DefaultClient.Do(req)
  if err != nil {
    panic(err)
  }
  defer res.Body.Close()

  fmt.Println(res.Status)
}`},{id:"csharp",label:"C#",code:`using System.Net.Http.Headers;
using System.Text;

using var client = new HttpClient();
${i?`client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "<IRANAPI_API_KEY>");
client.DefaultRequestHeaders.Add("X-IranAPI-Client", "<CLIENT_ID>");
`:""}
var json = """
${o}
""";

using var content = new StringContent(json, Encoding.UTF8, "application/json");
using var response = await client.PostAsync("${s}", content);
response.EnsureSuccessStatusCode();

Console.WriteLine(await response.Content.ReadAsStringAsync());`},{id:"java",label:"Java",code:`HttpClient client = HttpClient.newHttpClient();
String body = """
${o}
""";

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("${s}"))
${i?`    .header("Authorization", "Bearer <IRANAPI_API_KEY>")
    .header("X-IranAPI-Client", "<CLIENT_ID>")
`:""}    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(body))
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`},{id:"ruby",label:"Ruby",code:`require "json"
require "net/http"

uri = URI("${s}")
request = Net::HTTP::Post.new(uri)
${i?`request["Authorization"] = "Bearer <IRANAPI_API_KEY>"
request["X-IranAPI-Client"] = "<CLIENT_ID>"
`:""}request["Content-Type"] = "application/json"
request.body = ${o}.to_json

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == "https") do |http|
  http.request(request)
end

puts response.body`}]}function je(){var P,C,v;const{slug:r}=k(),n=O(),c=B(),{data:s,isLoading:i,isError:g}=D(r,{initialData:n==null?void 0:n.api}),{data:l}=z(r,{initialData:n==null?void 0:n.similarApis}),o=J(),[j,f]=N.useState(!1),[q,E]=N.useState("curl");U({title:s?s.name:"جزئیات API",description:(s==null?void 0:s.short_description)||(s==null?void 0:s.description)||"جزئیات فنی، پلن‌ها، مستندات و قرارداد دسترسی این API را بررسی کنید.",path:r?`/api/${r}`:"/browse",type:"article",structuredData:s?[F([{name:"خانه",path:"/"},{name:"مرور APIها",path:"/browse"},{name:s.name,path:`/api/${s.slug}`}]),{"@context":"https://schema.org","@type":"SoftwareApplication",name:s.name,applicationCategory:"DeveloperApplication",operatingSystem:"Web",description:s.description||s.short_description,url:K(`/api/${s.slug}`),provider:{"@type":"Organization",name:M},aggregateRating:s.rating_count>0?{"@type":"AggregateRating",ratingValue:Number(s.rating),reviewCount:s.rating_count}:void 0,offers:((P=s.pricing_plans)==null?void 0:P.map(a=>({"@type":"Offer",price:Number(a.price),priceCurrency:a.currency,availability:a.is_active?"https://schema.org/InStock":"https://schema.org/PreOrder",name:a.name})))||void 0}]:void 0});const y=N.useMemo(()=>s?ce(s):[],[s]),t=y.find(a=>a.id===q)||y[0];if(i)return e.jsxs("div",{className:"cyber-shell min-h-screen bg-background",children:[e.jsx(b,{}),e.jsx("main",{id:"main-content",className:"container py-16",children:e.jsx(d,{className:"h-80 animate-pulse bg-muted/60"})})]});if(g||!s)return e.jsxs("div",{className:"cyber-shell min-h-screen bg-background",children:[e.jsx(b,{}),e.jsx("main",{id:"main-content",className:"container py-16",children:e.jsx(d,{className:"border-destructive/30",children:e.jsxs(u,{className:"space-y-4 p-8",children:[e.jsx("h1",{className:"text-2xl font-bold",children:"این API پیدا نشد"}),e.jsx("p",{className:"text-muted-foreground",children:"ممکن است شناسه URL اشتباه باشد یا سرویس از فهرست عمومی خارج شده باشد."}),e.jsx(p,{asChild:!0,children:e.jsx($,{to:"/browse",children:"بازگشت به مرور APIها"})})]})})}),e.jsx(S,{})]});const H=async()=>{if(!(t!=null&&t.code)||!navigator.clipboard){I.error("کپی در این مرورگر در دسترس نیست.");return}try{await navigator.clipboard.writeText(t.code),f(!0),window.setTimeout(()=>f(!1),1600),I.success(`Access granted: نمونه ${t.label} کپی شد.`)}catch{I.error("اجازه دسترسی به کلیپ‌بورد در این مرورگر در دسترس نیست.")}};return e.jsxs("div",{className:"cyber-shell min-h-screen bg-background",children:[e.jsx(b,{}),e.jsxs("main",{id:"main-content",className:"container page-stack",children:[e.jsxs("section",{className:"page-hero grid gap-8 lg:grid-cols-[1.25fr,0.75fr]",children:[e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-3",children:[e.jsx(m,{variant:"outline",children:((C=s.category)==null?void 0:C.name)||"عمومی"}),s.is_featured?e.jsx(m,{children:"ویژه"}):null,s.is_popular?e.jsx(m,{variant:"secondary",children:"محبوب"}):null,e.jsx(X,{status:s.status}),e.jsx(Y,{}),e.jsx(G,{scheme:s.rapidapi.public_auth_scheme})]}),e.jsxs("div",{className:"space-y-4",children:[e.jsx("h1",{className:"section-title",children:s.name}),e.jsx("p",{className:"section-copy",children:s.description||s.short_description||"برای این API توضیحی ثبت نشده است."})]}),e.jsxs("div",{className:"flex flex-wrap gap-3",children:[e.jsxs("span",{className:"stat-chip",children:[e.jsx(ae,{className:"h-4 w-4 text-primary"}),"امتیاز ",s.rating]}),e.jsxs("span",{className:"stat-chip",children:[e.jsx(W,{className:"h-4 w-4 text-primary"}),_(s.views_count)," بازدید"]}),e.jsxs("span",{className:"stat-chip",children:["شروع قیمت: ",R(s.pricing_from)]})]}),e.jsxs("div",{className:"flex flex-wrap gap-2","aria-label":"متدهای رایج API",children:[e.jsx(A,{method:"GET"}),e.jsx(A,{method:"POST"}),e.jsx(A,{method:"PATCH"})]}),e.jsx("div",{className:"flex flex-wrap gap-2",children:s.tags.map(a=>e.jsx(m,{variant:"outline",children:a},a))}),e.jsxs("div",{className:"flex flex-wrap gap-3",children:[s.base_url?e.jsx(p,{asChild:!0,children:e.jsxs("a",{href:s.base_url,target:"_blank",rel:"noreferrer",className:"gap-2",children:["آدرس سرویس",e.jsx(Q,{className:"h-4 w-4"})]})}):null,s.documentation_url?e.jsx(p,{variant:"outline",asChild:!0,children:e.jsx("a",{href:s.documentation_url,target:"_blank",rel:"noreferrer",children:"مستندات مرجع"})}):null]})]}),e.jsxs(d,{className:"surface-card",children:[e.jsx(h,{children:e.jsx(x,{children:"خلاصه تصمیم‌گیری"})}),e.jsxs(u,{className:"content-list text-sm leading-7 text-muted-foreground",children:[e.jsxs("div",{className:"metric-card",children:[e.jsx("p",{className:"mb-1 font-semibold text-foreground",children:"روش دسترسی عمومی"}),e.jsx("p",{children:re[s.rapidapi.public_auth_scheme]||"مدیریت‌شده در IranAPI"})]}),e.jsxs("div",{className:"metric-card",children:[e.jsx("p",{className:"mb-1 font-semibold text-foreground",children:"نسخه کانونی"}),e.jsx("p",{children:s.rapidapi.canonical_version})]}),e.jsxs("div",{className:"metric-card",children:[e.jsx("p",{className:"mb-1 font-semibold text-foreground",children:"وضعیت انتشار"}),e.jsx("p",{children:te[s.rapidapi.publication_status]||s.rapidapi.publication_status})]}),e.jsxs("div",{className:"space-y-3 rounded-md bg-muted/50 p-4",children:[e.jsx("p",{className:"font-semibold text-foreground",children:"امتیازدهی"}),e.jsx("p",{children:(v=c.data)!=null&&v.authenticated?"اگر با این سرویس کار کرده‌اید، امتیاز شما به کیفیت پیشنهادها و رتبه‌بندی کمک می‌کند.":"برای ثبت امتیاز ابتدا وارد حساب خود شوید."}),e.jsx("div",{className:"flex flex-wrap gap-2",children:[1,2,3,4,5].map(a=>e.jsx(p,{variant:"outline",size:"sm",onClick:()=>r&&o.mutate({slug:r,rating:a}),disabled:o.isPending,children:a},a))})]})]})]})]}),e.jsxs("section",{className:"section-frame grid gap-8 lg:grid-cols-[1fr,1fr]",children:[e.jsxs(d,{className:"surface-card",children:[e.jsxs(h,{className:"flex flex-row items-center justify-between",children:[e.jsx(x,{children:"نمونه فراخوانی"}),e.jsxs(p,{variant:"outline",size:"sm",className:"gap-2",onClick:H,children:[j?e.jsx(ee,{className:"h-4 w-4 text-accent"}):e.jsx(se,{className:"h-4 w-4"}),j?"کپی شد":"کپی"]})]}),e.jsxs(u,{className:"space-y-4",children:[e.jsx("div",{className:"flex flex-wrap gap-2",role:"tablist","aria-label":"زبان نمونه فراخوانی API",children:y.map(a=>e.jsx(p,{type:"button",variant:(t==null?void 0:t.id)===a.id?"default":"outline",size:"sm",role:"tab","aria-selected":(t==null?void 0:t.id)===a.id,onClick:()=>{f(!1),E(a.id)},children:a.label},a.id))}),e.jsx("pre",{className:"overflow-x-auto rounded-md bg-slate-950 p-4 text-sm leading-7 text-slate-100",children:e.jsx("code",{children:(t==null?void 0:t.code)||"برای این API هنوز آدرس پایه ثبت نشده است."})}),e.jsx("p",{className:"text-sm leading-7 text-muted-foreground",children:"نمونه بالا برای مسیر دسترسی مدیریت‌شده IranAPI ساخته شده است. کلیدها را در محیط امن نگه دارید و فقط در زمان نیاز از داشبورد یا تنظیمات سرویس کپی کنید."}),e.jsx(V,{})]})]}),e.jsxs(d,{className:"surface-card",children:[e.jsx(h,{children:e.jsx(x,{children:"پلن‌های قیمت‌گذاری"})}),e.jsx(u,{className:"space-y-4",children:s.pricing_plans&&s.pricing_plans.length>0?s.pricing_plans.map(a=>e.jsxs("div",{className:"rounded-md border border-border/70 bg-background/70 p-4",children:[e.jsxs("div",{className:"mb-3 flex items-center justify-between gap-4",children:[e.jsxs("div",{children:[e.jsx("p",{className:"font-semibold",children:a.name}),e.jsx("p",{className:"text-sm text-muted-foreground",children:a.plan_type})]}),e.jsx(m,{children:R(a.price,a.currency)})]}),e.jsxs("div",{className:"grid gap-2 text-sm text-muted-foreground sm:grid-cols-2",children:[e.jsxs("p",{children:["درخواست روزانه: ",a.requests_per_day?_(a.requests_per_day):"نامشخص"]}),e.jsxs("p",{children:["درخواست ماهانه: ",a.requests_per_month?_(a.requests_per_month):"نامشخص"]})]}),a.features.length>0?e.jsx("ul",{className:"mt-3 grid gap-2 text-sm text-muted-foreground",children:a.features.map(w=>e.jsxs("li",{children:["• ",w]},w))}):null]},a.id)):e.jsx("p",{className:"text-muted-foreground",children:"برای این سرویس هنوز پلن فعالی ثبت نشده است."})})]})]}),e.jsxs("section",{className:"section-frame grid gap-8 lg:grid-cols-[1.2fr,0.8fr]",children:[e.jsxs(d,{className:"surface-card",children:[e.jsx(h,{children:e.jsxs(x,{className:"flex items-center gap-2",children:[e.jsx(Z,{className:"h-5 w-5 text-primary"}),"مستندات داخلی"]})}),e.jsx(u,{className:"space-y-4",children:s.documentations&&s.documentations.length>0?s.documentations.map(a=>e.jsxs("article",{className:"rounded-md border border-border/70 bg-background/70 p-5",children:[e.jsx("h3",{className:"mb-3 text-lg font-semibold",children:a.title}),e.jsx("p",{className:"whitespace-pre-wrap text-sm leading-7 text-muted-foreground",children:a.content})]},a.slug)):e.jsx("p",{className:"text-muted-foreground",children:"مستندات داخلی برای این API هنوز تکمیل نشده است."})})]}),e.jsxs(d,{className:"surface-card",children:[e.jsx(h,{children:e.jsx(x,{children:"سرویس‌های پیشنهادی مشابه"})}),e.jsxs(u,{className:"space-y-4",children:[e.jsx("div",{className:"rounded-md bg-muted/50 p-4 text-sm leading-7 text-muted-foreground",children:"سرویس‌های مشابه بر اساس دسته‌بندی و برچسب‌ها پیشنهاد می‌شوند تا ارزیابی گزینه‌های جایگزین ساده‌تر شود."}),l&&l.length>0?l.map(a=>e.jsxs("div",{className:"rounded-md border border-border/70 bg-background/70 p-4",children:[e.jsx("p",{className:"font-semibold",children:a.name}),e.jsx("p",{className:"mt-2 text-sm leading-7 text-muted-foreground",children:a.short_description||"بدون توضیح کوتاه"}),e.jsx(p,{variant:"link",className:"px-0",asChild:!0,children:e.jsx($,{to:`/api/${a.slug}`,children:"مشاهده جزئیات"})})]},a.slug)):e.jsx("p",{className:"text-muted-foreground",children:"برای این API مورد مشابهی پیدا نشد."})]})]})]})]}),e.jsx(S,{})]})}export{je as default};
