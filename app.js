const KEY='mes-courses-data-v1';
const clone=o=>JSON.parse(JSON.stringify(o));
let data=load(), meals=[], shopping=[], editingId=null, editingPhoto='';
function load(){try{return JSON.parse(localStorage.getItem(KEY))||clone(INITIAL_DATA)}catch{return clone(INITIAL_DATA)}}
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function slug(s){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+Date.now()}
function nav(id){$$('.screen').forEach(x=>x.classList.add('hidden'));$('#'+id).classList.remove('hidden');$$('nav button').forEach(b=>{let current=b.dataset.screen===id;b.classList.toggle('active',current);if(current)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});if(id==='recipes')renderRecipes()}
$$('nav button').forEach(b=>b.onclick=()=>nav(b.dataset.screen));
function renderSelect(){let s=$('#recipeSelect');s.innerHTML=data.recipes.map(r=>`<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('')}
function renderMeals(){$('#mealList').innerHTML=meals.length?meals.map((m,i)=>{let r=data.recipes.find(x=>x.id===m.recipeId);return `<div class="item"><div class="grow"><b>${escapeHtml(r?.name||'Recette supprimée')}</b><br><small>${m.servings} personne(s)</small></div><button onclick="removeMeal(${i})">Retirer</button></div>`}).join(''):'<p>Aucun repas sélectionné.</p>'}
window.removeMeal=i=>{meals.splice(i,1);renderMeals()};
$('#addMeal').onclick=()=>{let n=Number($('#servings').value);if(n>0){meals.push({recipeId:$('#recipeSelect').value,servings:n});renderMeals()}};
$('#buildList').onclick=()=>{let map=new Map();for(let m of meals){let r=data.recipes.find(x=>x.id===m.recipeId);if(!r)continue;let factor=m.servings/r.referenceServings;for(let ing of r.ingredients){let key=ing.name.trim().toLowerCase()+'|'+(ing.unit||'').trim().toLowerCase();let old=map.get(key)||{name:ing.name,unit:ing.unit||'',quantity:0,checked:false};old.quantity+=Number(ing.quantity)*factor;map.set(key,old)}}shopping=[...map.values()].filter(x=>x.quantity>0).sort((a,b)=>a.name.localeCompare(b.name,'fr'));renderShopping();nav('shopping')};
function fmt(n){return Number.isInteger(n)?n:Math.round(n*100)/100}
function renderShopping(){$('#shoppingList').innerHTML=shopping.length?shopping.map((x,i)=>`<div class="item ${x.checked?'checked':''}"><input type="checkbox" ${x.checked?'checked':''} onchange="toggleItem(${i})"><div class="grow"><b>${escapeHtml(x.name)}</b><br>${fmt(x.quantity)} ${escapeHtml(x.unit)}</div></div>`).join(''):'<p>La liste est vide. Choisissez d’abord des repas.</p>'}
window.toggleItem=i=>{shopping[i].checked=!shopping[i].checked;renderShopping()};
$('#clearChecked').onclick=()=>{shopping=shopping.filter(x=>!x.checked);renderShopping()};
function renderRecipes(){$('#recipeList').innerHTML=data.recipes.map(r=>`<div class="item">${r.photo?`<img class="recipe-thumb" src="${r.photo}" alt="Photo de ${escapeAttr(r.name)}" onclick="showPhoto('${r.id}')">`:''}<div class="grow"><b>${escapeHtml(r.name)}</b><br><small>${r.referenceServings} portion(s) · ${r.ingredients.length} ingrédient(s)</small></div><button onclick="editRecipe('${r.id}')">Modifier</button></div>`).join('');renderSelect()}
window.editRecipe=id=>{editingId=id;let r=data.recipes.find(x=>x.id===id);$('#recipeName').value=r.name;$('#recipeRef').value=r.referenceServings;editingPhoto=r.photo||'';renderPhotoPreview();renderIngredientRows(clone(r.ingredients));$('#recipeEditor').classList.remove('hidden')};
$('#newRecipe').onclick=()=>{editingId=null;editingPhoto='';renderPhotoPreview();$('#recipeName').value='';$('#recipeRef').value=4;renderIngredientRows([{name:'',quantity:'',unit:''}]);$('#recipeEditor').classList.remove('hidden')};
let editIngredients=[];
function renderIngredientRows(arr=editIngredients){editIngredients=arr;$('#ingredientRows').innerHTML=editIngredients.map((x,i)=>`<div class="row"><label>Nom<input value="${escapeAttr(x.name)}" oninput="changeIng(${i},'name',this.value)"></label><label>Qté<input type="number" step="any" min="0" value="${x.quantity}" oninput="changeIng(${i},'quantity',this.value)"></label><label>Unité<input value="${escapeAttr(x.unit||'')}" oninput="changeIng(${i},'unit',this.value)"></label><button onclick="removeIng(${i})">×</button></div>`).join('')}
window.changeIng=(i,k,v)=>editIngredients[i][k]=k==='quantity'?Number(v):v;window.removeIng=i=>{editIngredients.splice(i,1);renderIngredientRows()};
$('#addIngredient').onclick=()=>{editIngredients.push({name:'',quantity:'',unit:''});renderIngredientRows()};
$('#cancelRecipe').onclick=()=>$('#recipeEditor').classList.add('hidden');
$('#saveRecipe').onclick=()=>{let name=$('#recipeName').value.trim(), ref=Number($('#recipeRef').value), ingredients=editIngredients.filter(x=>x.name.trim()&&Number(x.quantity)>0);if(!name||ref<=0)return alert('Indiquez un nom et un nombre de portions valide.');if(editingId){let r=data.recipes.find(x=>x.id===editingId);Object.assign(r,{name,referenceServings:ref,ingredients,photo:editingPhoto})}else data.recipes.push({id:slug(name),name,referenceServings:ref,ingredients,photo:editingPhoto});save();$('#recipeEditor').classList.add('hidden');renderRecipes()};

function renderPhotoPreview(){let img=$('#recipePhotoPreview'),del=$('#removeRecipePhoto');if(editingPhoto){img.src=editingPhoto;img.classList.remove('hidden');del.classList.remove('hidden')}else{img.removeAttribute('src');img.classList.add('hidden');del.classList.add('hidden')}}
function compressPhoto(file){return new Promise((resolve,reject)=>{if(!file||!file.type.startsWith('image/'))return reject();let reader=new FileReader();reader.onerror=reject;reader.onload=()=>{let img=new Image();img.onerror=reject;img.onload=()=>{let max=1200,scale=Math.min(1,max/Math.max(img.width,img.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',.72))};img.src=reader.result};reader.readAsDataURL(file)})}
$('#recipePhotoInput').onchange=async e=>{try{editingPhoto=await compressPhoto(e.target.files[0]);renderPhotoPreview()}catch{alert('Impossible de lire cette photo.')}e.target.value=''};
$('#removeRecipePhoto').onclick=()=>{editingPhoto='';renderPhotoPreview()};
window.showPhoto=id=>{let r=data.recipes.find(x=>x.id===id);if(!r?.photo)return;let m=document.createElement('div');m.className='photo-modal';m.innerHTML=`<button type="button">Fermer</button><img src="${r.photo}" alt="Photo de ${escapeAttr(r.name)}">`;m.querySelector('button').onclick=()=>m.remove();m.onclick=e=>{if(e.target===m)m.remove()};document.body.appendChild(m)};

$('#exportData').onclick=()=>{let blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mes-courses-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(a.href)};
$('#importData').onchange=async e=>{try{let x=JSON.parse(await e.target.files[0].text());if(!Array.isArray(x.recipes))throw 0;data=x;save();renderRecipes();alert('Sauvegarde importée.')}catch{alert('Fichier de sauvegarde invalide.')}};
$('#resetData').onclick=()=>{if(confirm('Restaurer les recettes initiales ?')){data=clone(INITIAL_DATA);save();renderRecipes()}};
function escapeHtml(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function escapeAttr(s=''){return escapeHtml(s)}
renderSelect();renderMeals();renderShopping();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js'));
