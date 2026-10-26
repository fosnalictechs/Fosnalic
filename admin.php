<?php
session_start();
$ALLOWED_EMAIL="possyshad@gmail.com";
$UPLOAD_DIR="uploads/";
if(!is_dir($UPLOAD_DIR)) mkdir($UPLOAD_DIR,0755,true);

if(isset($_POST['email']) && isset($_POST['password'])){
  if(strtolower(trim($_POST['email']))!==$ALLOWED_EMAIL) $error="Only possyshad@gmail.com allowed — Access denied";
  else{
    $stored = @file_get_contents("admin_pass.txt");
    if(!$stored){
      if($_POST['password']!==$_POST['password2']) $error="Passwords not match";
      elseif(strlen($_POST['password'])<6) $error="Min 6 characters";
      else{ file_put_contents("admin_pass.txt", password_hash($_POST['password'], PASSWORD_DEFAULT)); $_SESSION['admin']=$ALLOWED_EMAIL; header("Location: admin.php"); exit; }
    }else{
      if(password_verify($_POST['password'],$stored)){ $_SESSION['admin']=$ALLOWED_EMAIL; header("Location: admin.php"); exit; }
      else $error="Wrong password for possyshad@gmail.com";
    }
  }
}
if(isset($_GET['logout'])){ session_destroy(); header("Location: admin.php"); exit; }
$isLogged = isset($_SESSION['admin']) && $_SESSION['admin']===$ALLOWED_EMAIL;
$firstTime = !file_exists("admin_pass.txt");

// Handle real app upload
if($isLogged && isset($_FILES['appFile']) && $_FILES['appFile']['error']==0){
  $name = $_POST['appName'] ?? 'App';
  $desc = $_POST['appDesc'] ?? '';
  $version = $_POST['appVersion'] ?? 'v1.0';
  $cat = $_POST['appCat'] ?? 'Other';
  $safeName = time()."_".preg_replace('/[^a-zA-Z0-9._-]/','_',$_FILES['appFile']['name']);
  $target = $UPLOAD_DIR.$safeName;
  if(move_uploaded_file($_FILES['appFile']['tmp_name'],$target)){
    $list = file_exists("apps.json") ? json_decode(file_get_contents("apps.json"),true) : [];
    $list[]=['name'=>$name,'desc'=>$desc,'version'=>$version,'category'=>$cat,'file'=>$safeName,'size'=>round($_FILES['appFile']['size']/1024/1024,1).' MB','date'=>date('Y-m-d H:i'),'downloads'=>0];
    file_put_contents("apps.json",json_encode($list,JSON_PRETTY_PRINT));
    $msg="✅ Uploaded: $safeName — now on my-apps.php";
  }else $msg="❌ Upload failed — set uploads/ to 755";
}
if($isLogged && isset($_GET['delapp'])){
  $list = json_decode(file_get_contents("apps.json"),true);
  $file = $list[$_GET['delapp']]['file'] ?? '';
  @unlink($UPLOAD_DIR.$file);
  unset($list[$_GET['delapp']]);
  file_put_contents("apps.json",json_encode(array_values($list),JSON_PRETTY_PRINT));
  header("Location: admin.php"); exit;
}
$apps = file_exists("apps.json") ? json_decode(file_get_contents("apps.json"),true) : [];
?>
<?php if(!$isLogged): ?>
<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"><style>body{background:#F5F7FA;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:'Segoe UI',sans-serif;padding:20px} .box{background:white;padding:30px;border-radius:16px;width:100%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,0.2)} .input{width:100%;padding:12px 12px 12px 40px;border:1px solid #E2E8F0;border-radius:8px;margin-bottom:12px} .btn{width:100%;padding:13px;background:linear-gradient(135deg,#2A4B7C,#FF6B35);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer} .field{position:relative} .field i{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#A0AEC0}</style></head><body>
<div class="box"><div style="text-align:center"><h2>Welcome back</h2><p style="color:#718096;font-size:0.9rem;margin:6px 0 20px"><?php echo $firstTime?'Create password for possyshad@gmail.com':'Login — possyshad@gmail.com only'; ?></p></div>
<?php if(isset($error)) echo "<div style='background:#FEF2F2;color:#991B1B;padding:10px;border-radius:8px;margin-bottom:12px'>$error</div>"; ?>
<form method="POST"><div class="field"><i class="fas fa-envelope"></i><input class="input" type="email" name="email" value="possyshad@gmail.com" required></div><div class="field"><i class="fas fa-lock"></i><input class="input" type="password" name="password" placeholder="Password" required></div><?php if($firstTime): ?><div class="field"><i class="fas fa-lock"></i><input class="input" type="password" name="password2" placeholder="Confirm Password" required></div><?php endif; ?><button class="btn"><?php echo $firstTime?'Create Account — possyshad@gmail.com':'Continue with Email'; ?></button></form><p style="text-align:center;font-size:0.75rem;color:#A0AEC0;margin-top:14px"><i class="fas fa-shield-alt"></i> Only possyshad@gmail.com — Password stays</p></div></body></html>
<?php exit; endif; ?>

<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin — FOSNALIC — possyshad@gmail.com</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"><style>:root{--primary:#2A4B7C;--secondary:#FF6B35;--border:#E2E8F0;--shadow:0 10px 30px rgba(0,0,0,0.08)}*{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',sans-serif}body{background:#F5F7FA;padding:20px} .container{max-width:1200px;margin:0 auto} .card{background:white;border-radius:14px;box-shadow:var(--shadow);border:1px solid var(--border);padding:20px;margin-bottom:20px} .btn{padding:10px 18px;background:linear-gradient(135deg,var(--primary),var(--secondary));color:white;border-radius:8px;border:none;cursor:pointer;font-weight:600} .btn-dark{background:#111!important} .input{width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:10px} .grid{display:grid;grid-template-columns:1fr 1fr;gap:20px} @media(max-width:768px){.grid{grid-template-columns:1fr}} textarea{width:100%;min-height:250px;font-family:monospace;font-size:0.85rem;padding:12px;border:1px solid var(--border);border-radius:8px} .file-list{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:15px} .file-btn{padding:6px 12px;background:white;border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:0.85rem} .file-btn.active{background:var(--primary);color:white}</style></head><body>
<div class="container">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px"><div><h1>FOSNALIC Admin ✅</h1><p style="color:#718096">Logged as <?php echo $ALLOWED_EMAIL; ?> — Email login stays</p></div><div style="display:flex;gap:10px"><a href="index.html" style="padding:10px 14px;background:#111;color:white;border-radius:8px;text-decoration:none">View Site</a><a href="?logout=1" style="padding:10px 14px;background:#e53e3e;color:white;border-radius:8px;text-decoration:none">Logout</a></div></div>

<?php if(isset($msg)) echo "<div class='card' style='background:#F0FDF4;color:#166534;border-color:#BBF7D0'>$msg</div>"; ?>

<!-- REAL APP UPLOAD — SERVER FOLDER -->
<div class="card" style="border:2px solid #2A4B7C">
<h2><i class="fas fa-cloud-upload-alt"></i> My Apps — Real Server Upload (not localStorage)</h2>
<p style="color:#718096;font-size:0.85rem;margin-bottom:12px">Upload APK/ZIP here — saves to /uploads/ — users download from my-apps.php</p>
<form method="POST" enctype="multipart/form-data">
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
<input class="input" name="appName" placeholder="App Name * e.g. FOSNALIC School System" required>
<input class="input" name="appCat" placeholder="Category e.g. School / Business">
</div>
<textarea class="input" name="appDesc" placeholder="Description *" required style="min-height:70px"></textarea>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
<input class="input" name="appVersion" placeholder="Version e.g. v3.0">
<input class="input" type="file" name="appFile" accept=".apk,.zip,.rar,.pdf,.aab,.exe" required>
</div>
<button class="btn"><i class="fas fa-upload"></i> Upload to Server — Real File</button>
</form>

<h3 style="margin-top:20px">Uploaded Apps — From Server (<?php echo count($apps); ?>)</h3>
<div style="margin-top:10px">
<?php foreach($apps as $i=>$a): ?>
<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border-bottom:1px solid #eee;flex-wrap:wrap;gap:8px">
<div><strong><?php echo htmlspecialchars($a['name']); ?></strong> — <?php echo $a['version']; ?> — <?php echo $a['size']; ?> — <?php echo $a['category']; ?><br><small><?php echo htmlspecialchars($a['desc']); ?></small><br><small style="color:#718096">File: <?php echo $a['file']; ?> — <?php echo $a['date']; ?></small></div>
<div style="display:flex;gap:6px"><a href="uploads/<?php echo $a['file']; ?>" target="_blank" style="background:#2A4B7C;color:white;padding:6px 10px;border-radius:6px;text-decoration:none">Download</a><a href="?delapp=<?php echo $i; ?>" onclick="return confirm('Delete app from server?')" style="background:red;color:white;padding:6px 10px;border-radius:6px;text-decoration:none">Delete</a></div>
</div>
<?php endforeach; ?>
<?php if(!count($apps)) echo "<p style='color:#718096'>No apps uploaded yet — upload above</p>"; ?>
</div>
</div>

<!-- PAGE EDITOR — YOUR 11 PAGES -->
<div class="card">
<h2><i class="fas fa-file-code"></i> Edit Pages — 11 Pages</h2>
<p style="color:#718096;font-size:0.85rem;margin-bottom:10px">Click page to edit — Save will write to file (requires write permission) OR copy code</p>
<div class="file-list">
<button class="file-btn active" onclick="loadPage('index.html')">index</button>
<button class="file-btn" onclick="loadPage('services.html')">services</button>
<button class="file-btn" onclick="loadPage('portfolio.html')">portfolio</button>
<button class="file-btn" onclick="loadPage('academy.html')">academy</button>
<button class="file-btn" onclick="loadPage('pricing.html')">pricing</button>
<button class="file-btn" onclick="loadPage('about.html')">about</button>
<button class="file-btn" onclick="loadPage('extra-help.html')">extra-help</button>
<button class="file-btn" onclick="loadPage('contact.html')">contact</button>
<button class="file-btn" onclick="loadPage('live-chat.html')">live-chat</button>
<button class="file-btn" onclick="loadPage('my-apps.php')">my-apps.php</button>
<button class="file-btn" onclick="loadPage('admin.php')">admin.php</button>
</div>
<textarea id="pageEditor" placeholder="Select a page above..."></textarea>
<div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap"><button class="btn" onclick="savePage()">Save to Server (if writable)</button><button class="btn btn-dark" onclick="downloadPage()">Download File</button><span id="pageStatus" style="font-size:0.85rem;padding:8px"></span></div>
</div>

<!-- TICKER / NEWS / ADS / CHAT — localStorage + apps.json -->
<div class="grid">
<div class="card"><h2>Ticker</h2><input class="input" id="tickerInput" placeholder="Add ticker"><button class="btn" onclick="addTicker()">Add</button><div id="tickerList" style="margin-top:12px"></div></div>
<div class="card"><h2>Ads</h2><select class="input" id="adSlot"><option value="adHeader">Header</option><option value="adMiddle">Middle</option><option value="adFooter">Footer</option></select><input class="input" id="adImage" placeholder="Image URL"><input class="input" id="adLink" placeholder="Link URL"><textarea class="input" id="adText" placeholder="HTML" style="min-height:60px"></textarea><button class="btn" onclick="saveAd()">Save Ad</button><button class="btn btn-dark" onclick="clearAd()">Clear</button></div>
</div>

<div class="card"><h2>News — Auto</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><input class="input" id="newsTitle" placeholder="Title"><input class="input" id="newsImg" placeholder="Image URL"></div><input class="input" id="newsDesc" placeholder="Description"><button class="btn" onclick="addNews()">Add News</button><div id="newsList" style="margin-top:12px"></div></div>

<div class="grid">
<div class="card"><h2>Live Chat</h2><div id="chatAdminList"></div><button class="btn btn-dark" onclick="clearChat()">Clear Chat</button></div>
<div class="card"><h2>Extra — Apps.json Editor (backup)</h2><textarea id="appsJsonEditor" style="min-height:150px"></textarea><button class="btn" onclick="saveAppsJson()">Save apps.json</button></div>
</div>

</div>

<script>
let currentPage='index.html';
function loadPage(name){
currentPage=name;
document.querySelectorAll('.file-btn').forEach(b=>b.classList.remove('active'));
if(event) event.target.classList.add('active');
fetch(name).then(r=>r.text()).then(t=>{
document.getElementById('pageEditor').value=t;
document.getElementById('pageStatus').textContent='Loaded: '+name;
}).catch(()=>{document.getElementById('pageEditor').value='// Could not load '+name+' — maybe file not exist or blocked';});
}
function savePage(){
const content=document.getElementById('pageEditor').value;
fetch('admin.php?action=savepage&file='+encodeURIComponent(currentPage),{method:'POST',body:content}).then(r=>r.text()).then(res=>{
document.getElementById('pageStatus').textContent=res;
});
}
function downloadPage(){
const blob=new Blob([document.getElementById('pageEditor').value],{type:'text/html'});
const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=currentPage;a.click();
}

// Ticker, News, Ads, Chat — using localStorage (keep your old logic)
function addTicker(){const v=document.getElementById('tickerInput').value.trim();if(!v)return;let t=JSON.parse(localStorage.getItem('fosnalic_ticker')||'[]');t.push(v);localStorage.setItem('fosnalic_ticker',JSON.stringify(t));document.getElementById('tickerInput').value='';renderTicker();}
function renderTicker(){let t=JSON.parse(localStorage.getItem('fosnalic_ticker')||'[]');document.getElementById('tickerList').innerHTML=t.map((x,i)=>`<div style="display:flex;justify-content:space-between;padding:4px;border-bottom:1px solid #eee"><span>${x}</span><button onclick="removeTicker(${i})" style="background:red;color:white;border:none;padding:2px 6px">X</button></div>`).join('');}
function removeTicker(i){let t=JSON.parse(localStorage.getItem('fosnalic_ticker')||'[]');t.splice(i,1);localStorage.setItem('fosnalic_ticker',JSON.stringify(t));renderTicker();}
function saveAd(){const slot=document.getElementById('adSlot').value;const data={image:document.getElementById('adImage').value,link:document.getElementById('adLink').value,text:document.getElementById('adText').value};localStorage.setItem(slot,JSON.stringify(data));alert('Saved '+slot);}
function clearAd(){const slot=document.getElementById('adSlot').value;localStorage.removeItem(slot);alert('Cleared');}
function addNews(){const title=document.getElementById('newsTitle').value,img=document.getElementById('newsImg').value,desc=document.getElementById('newsDesc').value;if(!title)return alert('Title');let news=JSON.parse(localStorage.getItem('fosnalic_news')||'[]');news.push({title,img:img||'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600',desc,tag:new Date().toLocaleDateString()});localStorage.setItem('fosnalic_news',JSON.stringify(news));renderNews();}
function renderNews(){let news=JSON.parse(localStorage.getItem('fosnalic_news')||'[]');document.getElementById('newsList').innerHTML=news.map((n,i)=>`<div style="padding:6px;border-bottom:1px solid #eee;display:flex;justify-content:space-between"><span><strong>${n.title}</strong></span><button onclick="removeNews(${i})" style="background:red;color:white;border:none;padding:2px 6px">X</button></div>`).join('');}
function removeNews(i){let news=JSON.parse(localStorage.getItem('fosnalic_news')||'[]');news.splice(i,1);localStorage.setItem('fosnalic_news',JSON.stringify(news));renderNews();}
function renderChatAdmin(){let chat=JSON.parse(localStorage.getItem('fosnalic_chat')||'[]');document.getElementById('chatAdminList').innerHTML=chat.map((c,i)=>`<div style="padding:6px;border-bottom:1px solid #eee"><strong>${c.title}</strong><br><button onclick="delChat(${i})" style="background:red;color:white;border:none;padding:2px 6px">Delete</button></div>`).join('')||'No chat';}
function delChat(i){let chat=JSON.parse(localStorage.getItem('fosnalic_chat')||'[]');chat.splice(i,1);localStorage.setItem('fosnalic_chat',JSON.stringify(chat));renderChatAdmin();}
function clearChat(){if(confirm('Clear chat?')){localStorage.removeItem('fosnalic_chat');renderChatAdmin();}}
function renderAll(){renderTicker();renderNews();renderChatAdmin();loadAppsJsonEditor();}
function loadAppsJsonEditor(){fetch('apps.json').then(r=>r.text()).then(t=>document.getElementById('appsJsonEditor').value=t).catch(()=>document.getElementById('appsJsonEditor').value='[]');}
function saveAppsJson(){fetch('admin.php?action=saveapps',{method:'POST',body:document.getElementById('appsJsonEditor').value}).then(r=>r.text()).then(res=>alert(res));}
renderAll();
loadPage('index.html');
</script>

<?php
if(isset($_GET['action']) && $_GET['action']=='savepage' && $isLogged){
  $file = basename($_GET['file']);
  if(file_exists($file) && is_writable($file) || !file_exists($file)){
    $content = file_get_contents("php://input");
    file_put_contents($file,$content);
    echo "Saved $file to server";
  }else echo "Cannot write $file — set permission 644/666 in cPanel";
  exit;
}
if(isset($_GET['action']) && $_GET['action']=='saveapps' && $isLogged){
  $content = file_get_contents("php://input");
  file_put_contents("apps.json",$content);
  echo "apps.json saved";
  exit;
}
?>
</body></html>