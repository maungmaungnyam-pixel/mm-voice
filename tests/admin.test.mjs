import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker.mjs";
import { RSS_SOURCES } from "../news-pipeline.mjs";
function makeAdminDB(seed = []) {
  const posts = new Map(seed.map((row) => [row.id, { view_count: 0, ...row }]));
  const suppressions = new Set();
  const newsSources = new Map(RSS_SOURCES.map((source) => [source.name, { source_name: source.name, feed_url: source.feedUrl, hosts_json: JSON.stringify(source.hosts), region: "myanmar", enabled: 1, created_at: "2026-10-15T00:00:00.000Z", updated_at: "2026-10-15T00:00:00.000Z" }]));
  const DB = {
    prepare(sql) {
      let values = [];
      const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();
      const statement = {
        bind(...args) { values = args; return statement; },
        async first() {
          if (normalized.startsWith("select * from posts where id = ?")) return posts.get(values[0]) || null;
          if (normalized.startsWith("select type, source_name, source_url from posts where id = ?")) {
            const row = posts.get(values[0]);
            return row ? { type: row.type, source_name: row.source_name, source_url: row.source_url } : null;
          }
          return null;
        },
        async all() {
          if (normalized.startsWith("select source_name from news_sources")) return { results: [...newsSources.values()].filter((row) => row.region === "myanmar" && row.enabled === 1).map((row) => ({ source_name: row.source_name })) };
          if (normalized.startsWith("select s.source_name")) return { results: [...newsSources.values()].map((row) => ({ ...row, last_checked_at: "", last_success_at: "", last_status: "pending", items_seen: 0, last_error: "", story_count: [...posts.values()].filter((post) => post.type === "news" && post.source_name === row.source_name).length })) };
          if (normalized.startsWith("select * from posts where type = 'news'")) {
            const sources = new Set(values);
            return { results: [...posts.values()].filter((row) => row.type === "news" && sources.has(row.source_name)) };
          }
          return { results: [] };
        },
        async run() {
          if (normalized.startsWith("insert into posts")) {
            const [id,type,title,category,image_url,body,source_name,source_url,location,salary,phone,line_id,is_verified,verified_by,verified_at,is_scam_alert,created_at,updated_at] = values;
            posts.set(id,{id,type,title,category,image_url,body,source_name,source_url,location,salary,phone,line_id,is_verified,verified_by,verified_at,is_scam_alert,created_at,updated_at,view_count:0});
          } else if (normalized.startsWith("update posts set")) {
            const [type,title,category,image_url,body,source_name,source_url,location,salary,phone,line_id,is_verified,verified_by,verified_at,is_scam_alert,updated_at,id] = values;
            const row=posts.get(id);
            if(row) Object.assign(row,{type,title,category,image_url,body,source_name,source_url,location,salary,phone,line_id,is_verified,verified_by,verified_at,is_scam_alert,updated_at});
          } else if (normalized.startsWith("insert or ignore into admin_post_suppressions")) {
            suppressions.add(values[0]);
          } else if (normalized.startsWith("insert into news_sources")) {
            const [source_name,feed_url,hosts_json,created_at,updated_at] = values;
            if (newsSources.has(source_name) || [...newsSources.values()].some((row) => row.feed_url === feed_url)) throw new Error("duplicate source");
            newsSources.set(source_name,{source_name,feed_url,hosts_json,region:"myanmar",enabled:1,created_at,updated_at});
          } else if (normalized.startsWith("update news_sources set enabled")) {
            const [enabled,updated_at,source_name] = values, source = newsSources.get(source_name);
            if(source) Object.assign(source,{enabled,updated_at});
            return { meta: { changes: source ? 1 : 0 } };
          } else if (normalized.startsWith("delete from posts where id = ?")) {
            posts.delete(values[0]);
          }
          return { meta: { changes: 1 } };
        }
      };
      return statement;
    },
    async batch(statements) {
      const results=[];
      for (const statement of statements) results.push(await statement.run());
      return results;
    }
  };
  return { DB, posts, suppressions, newsSources };
}

async function adminCookie(env) {
  const request=new Request("https://mm-voice.test/api/admin/session",{
    method:"POST",headers:{origin:"https://mm-voice.test","content-type":"application/json"},
    body:JSON.stringify({password:env.ADMIN_PASSWORD})
  });
  const response=await worker.fetch(request,env);
  assert.equal(response.status,200);
  return response.headers.get("set-cookie").split(";")[0];
}

function adminRequest(method,path,body,cookie) {
  const headers={origin:"https://mm-voice.test",cookie,"content-type":"application/json"};
  return new Request(`https://mm-voice.test${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
}

const envWithPassword=(DB)=>({DB,ADMIN_PASSWORD:"local-test-password"});

test("admin can publish and edit MM VOICE posts, and cannot use an unrelated publisher label", async () => {
  const state=makeAdminDB(); const env=envWithPassword(state.DB); const cookie=await adminCookie(env);
  const created=await worker.fetch(adminRequest("POST","/api/admin/posts",{type:"news",title:"A local MM VOICE update",body:"Test content"},cookie),env);
  assert.equal(created.status,201);
  const createdBody=await created.json();
  assert.equal(createdBody.item.sourceName,"MM VOICE Admin");
  assert.equal(state.posts.get(createdBody.item.id).title,"A local MM VOICE update");

  const updated=await worker.fetch(adminRequest("PUT",`/api/admin/posts/${createdBody.item.id}`,{type:"news",title:"Updated editorial post",body:"Updated content"},cookie),env);
  assert.equal(updated.status,200);
  assert.equal((await updated.json()).item.title,"Updated editorial post");

  const invalid=await worker.fetch(adminRequest("POST","/api/admin/posts",{type:"news",title:"Wrong scope",body:"No",sourceName:"Thai Bro"},cookie),env);
  assert.equal(invalid.status,400);
  assert.equal((await invalid.json()).error,"mm_voice_news_source_required");
});

test("admin deletion removes only MM VOICE news and suppresses deleted feed sources", async () => {
  const feedPost={id:"feed-1",type:"news",title:"Imported story",source_name:"Myanmar Now",source_url:"https://myanmar-now.org/story/1",created_at:"2026-10-15T00:00:00.000Z"};
  const unrelated={id:"other-1",type:"news",title:"Outside scope",source_name:"Other source",source_url:"https://example.com/story"};
  const state=makeAdminDB([feedPost,unrelated]); const env=envWithPassword(state.DB); const cookie=await adminCookie(env);
  const blocked=await worker.fetch(adminRequest("DELETE","/api/admin/posts/other-1",undefined,cookie),env);
  assert.equal(blocked.status,404);
  assert.equal(state.posts.has("other-1"),true);

  const removed=await worker.fetch(adminRequest("DELETE","/api/admin/posts/feed-1",undefined,cookie),env);
  assert.equal(removed.status,200);
  assert.equal(state.posts.has("feed-1"),false);
  assert.equal(state.suppressions.has(feedPost.source_url),true);
});

test("admin can list, add, pause, and restore Myanmar news sources without deleting stories", async () => {
  const state=makeAdminDB(); const env=envWithPassword(state.DB); const cookie=await adminCookie(env);
  const initial=await worker.fetch(adminRequest("GET","/api/admin/news/sources",undefined,cookie),env);
  assert.equal(initial.status,200);
  assert.equal((await initial.json()).items.length,RSS_SOURCES.length);

  const added=await worker.fetch(adminRequest("POST","/api/admin/news/sources",{sourceName:"Mizzima News",feedUrl:"https://feeds.example.org/myanmar.xml",allowedHosts:"example.org, www.example.org"},cookie),env);
  assert.equal(added.status,201);
  assert.deepEqual((await added.json()).source.allowedHosts,["feeds.example.org","example.org"]);

  const minimal=await worker.fetch(adminRequest("POST","/api/admin/news/sources",{sourceName:"Myanmar Channel",feedUrl:"https://news.myanmar.org/rss.xml"},cookie),env);
  assert.equal(minimal.status,201);
  assert.deepEqual((await minimal.json()).source.allowedHosts,["news.myanmar.org"]);

  const invalid=await worker.fetch(adminRequest("POST","/api/admin/news/sources",{sourceName:"Unsafe feed",feedUrl:"http://example.org/rss.xml"},cookie),env);
  assert.equal(invalid.status,400);

  const paused=await worker.fetch(adminRequest("PUT",`/api/admin/news/sources/${encodeURIComponent("Mizzima News")}`,{enabled:false},cookie),env);
  assert.equal(paused.status,200);
  assert.equal(state.newsSources.get("Mizzima News").enabled,0);
  const restored=await worker.fetch(adminRequest("PUT",`/api/admin/news/sources/${encodeURIComponent("Mizzima News")}`,{enabled:true},cookie),env);
  assert.equal(restored.status,200);
  assert.equal(state.newsSources.get("Mizzima News").enabled,1);
});
