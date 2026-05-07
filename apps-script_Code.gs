/**
 * Team Haim — Apps Script Web App backend
 * Deploy: Extensions → Apps Script → paste this → Deploy → Web App
 *   Execute as: Me  |  Who has access: Anyone
 * Then copy the Web App URL into APPS_SCRIPT_URL inside index.html.
 */

const SHEET_ID = ""; // leave empty to use the bound spreadsheet (recommended)
const SHEETS = {
  Weekly:   ["date","week","type","builder","maxKm","targetIntensity","actualKm","splits","avgPace","feel","actualIntensity","tight","tightNote"],
  Profile:  ["name","age","height","weight","vo2max","lt_pace","lt_hr","restHR","maxHR","cadence","stride","prs","coachNotes"],
  Races:    ["date","name","distance","time","pace","place","notes"],
  Goals:    ["name","date","distance","target","priority","status","notes"],
  Strength: ["date","group","exercise","sets","reps","weight","rest","rpe","status"],
  Dynamics: ["date","avgPace","bestPace","avgHR","peakHR","cadence","up","down","time","z1","z2","z3","z4","z5"]
};

function getSS(){ return SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet(); }

function ensureSheets_(){
  const ss=getSS();
  for(const name in SHEETS){
    let sh=ss.getSheetByName(name);
    if(!sh){ sh=ss.insertSheet(name); sh.appendRow(SHEETS[name]); }
    else if(sh.getLastRow()===0){ sh.appendRow(SHEETS[name]); }
  }
}

function out_(ok,data,error){
  return ContentService.createTextOutput(JSON.stringify({ok,data,error}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e){
  try{
    ensureSheets_();
    const action=(e.parameter.action||"").trim();
    if(action==="getWeek")    return out_(true, getWeek_(e.parameter.week));
    if(action==="getAll")     return out_(true, getAll_());
    if(action==="getProfile") return out_(true, getProfile_());
    return out_(false,null,"Unknown action: "+action);
  }catch(err){ return out_(false,null,String(err)); }
}

function doPost(e){
  try{
    ensureSheets_();
    const body=JSON.parse(e.postData.contents||"{}");
    const action=body.action, data=body.data||{};
    if(action==="saveDay")      return out_(true, saveDay_(data));
    if(action==="saveProfile")  return out_(true, saveProfile_(data));
    if(action==="saveWorkout")  return out_(true, saveStrength_(data));
    if(action==="saveRace")     return out_(true, saveRace_(data));
    if(action==="saveGoal")     return out_(true, saveGoal_(data));
    if(action==="saveDynamics") return out_(true, saveDynamics_(data));
    return out_(false,null,"Unknown action: "+action);
  }catch(err){ return out_(false,null,String(err)); }
}

/* ───── reads ───── */
function rowsAsObjects_(sheetName){
  const sh=getSS().getSheetByName(sheetName);
  const v=sh.getDataRange().getValues();
  if(v.length<2) return [];
  const head=v[0];
  return v.slice(1).map(r=>{
    const o={};
    head.forEach((h,i)=>{
      let val=r[i];
      if(val instanceof Date) val=Utilities.formatDate(val,Session.getScriptTimeZone(),"yyyy-MM-dd");
      // try parse JSON for object cols
      if(typeof val==="string" && (val.startsWith("{")||val.startsWith("["))){
        try{ val=JSON.parse(val) }catch(e){}
      }
      o[h]=val;
    });
    return o;
  });
}
function getWeek_(week){
  const all=rowsAsObjects_("Weekly").filter(r=>r.week===week);
  const map={};
  all.forEach(r=>{ map[r.date]=r; });
  return map;
}
function getAll_(){
  const data={};
  for(const name in SHEETS) data[name]=rowsAsObjects_(name);
  // Profile is single row → return as object
  if(data.Profile && data.Profile.length) data.Profile=data.Profile[0];
  return data;
}
function getProfile_(){
  const rows=rowsAsObjects_("Profile");
  return rows[0]||{};
}

/* ───── writes ───── */
function upsertByKey_(sheetName,keyCol,keyVal,obj){
  const sh=getSS().getSheetByName(sheetName);
  const head=sh.getDataRange().getValues()[0];
  const idx=head.indexOf(keyCol);
  const lastRow=sh.getLastRow();
  let rowNum=-1;
  if(lastRow>1){
    const col=sh.getRange(2,idx+1,lastRow-1,1).getValues();
    for(let i=0;i<col.length;i++){
      let v=col[i][0];
      if(v instanceof Date) v=Utilities.formatDate(v,Session.getScriptTimeZone(),"yyyy-MM-dd");
      if(String(v)===String(keyVal)){ rowNum=i+2; break; }
    }
  }
  const row=head.map(h=>{
    let v=obj[h];
    if(v && typeof v==="object") v=JSON.stringify(v);
    return v??"";
  });
  if(rowNum>0) sh.getRange(rowNum,1,1,row.length).setValues([row]);
  else sh.appendRow(row);
  return {row:rowNum>0?rowNum:sh.getLastRow()};
}
function saveDay_(data){
  const day=data.day||{};
  const flat={
    date:data.date, week:data.week,
    type:day.type||"", builder:day.builder||{},
    maxKm:day.maxKm||"", targetIntensity:day.targetIntensity||0,
    actualKm:day.actualKm||"", splits:day.splits||[], avgPace:day.avgPace||"",
    feel:day.feel||"", actualIntensity:day.actualIntensity||0,
    tight:day.tight||[], tightNote:day.tightNote||""
  };
  return upsertByKey_("Weekly","date",data.date,flat);
}
function saveProfile_(p){
  const sh=getSS().getSheetByName("Profile");
  const head=sh.getDataRange().getValues()[0];
  const row=head.map(h=>{let v=p[h];if(v&&typeof v==="object")v=JSON.stringify(v);return v??""});
  sh.getRange(2,1,1,row.length).setValues([row]);
  return {ok:true};
}
function saveStrength_(s){
  // append (or update by composite date+exercise)
  const key=(s.date||"")+"|"+(s.exercise||"");
  const sh=getSS().getSheetByName("Strength");
  const head=sh.getDataRange().getValues()[0];
  const all=sh.getDataRange().getValues();
  let row=-1;
  for(let i=1;i<all.length;i++){
    let d=all[i][head.indexOf("date")];
    if(d instanceof Date) d=Utilities.formatDate(d,Session.getScriptTimeZone(),"yyyy-MM-dd");
    const k=d+"|"+all[i][head.indexOf("exercise")];
    if(k===key){row=i+1;break}
  }
  const r=head.map(h=>s[h]??"");
  if(row>0) sh.getRange(row,1,1,r.length).setValues([r]);
  else sh.appendRow(r);
  return {ok:true};
}
function saveRace_(r){ return upsertByKey_("Races","date",r.date,r); }
function saveGoal_(g){ return upsertByKey_("Goals","name",g.name,g); }
function saveDynamics_(d){ return upsertByKey_("Dynamics","date",d.date,d); }