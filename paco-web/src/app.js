import {createBackend,message} from './backend.js';
import {petError,today,ageLabel,vaccineError,vaccineReminder,escapeHtml as esc} from './domain.js';
import {BREED_OTHER,breedsForSpecies} from './breeds.js';
const app=document.querySelector('#app');
const state={screen:'loading',tab:'home',user:null,pets:[],pet:null,memories:[],vaccinations:[],email:'',purpose:'signup',busy:false,error:'',notice:'',editing:false,petRequestId:null,memoryRequestId:null,vaccineRequestId:null,vaccineEditing:null,lastSend:0,recovery:false};
let api,config;
function authRedirectOrigin(fallback){
 try{
  const origin=new URL(window.location.origin).origin;
  const url=new URL(origin);
  const local=['127.0.0.1','localhost','[::1]'].includes(url.hostname);
  return url.protocol==='https:'||(url.protocol==='http:'&&local)?origin:fallback;
 }catch{return fallback;}
}
const brand='<a href="/" class="brand" aria-label="Paco dejando huella, inicio"><img class="brand-mark" src="/paco-mark.svg" alt=""><span class="brand-copy"><strong>Paco</strong><small>dejando huella</small></span></a>';
const field=(name,label,type='text',value='',attrs='')=>'<label class="field"><span>'+label+'</span><input name="'+name+'" type="'+type+'" value="'+esc(value)+'" '+attrs+'></label>';
const password=(name,label)=>field(name,label,'password','','required minlength="10" autocomplete="'+(state.screen==='login'?'current-password':'new-password')+'"')+'<button type="button" class="text-button align-right" data-show="'+name+'">Mostrar contraseña</button>';
const submit=label=>'<button class="primary" type="submit">'+label+' <span aria-hidden="true">↗</span></button>';
const back=screen=>'<button class="back" data-screen="'+screen+'">← Volver</button>';
function alerts(){return '<p id="error" class="error" role="alert" '+(!state.error?'hidden':'')+'>'+esc(state.error)+'</p><p id="notice" class="notice" role="status">'+esc(state.notice)+'</p>';}
function title(kicker,heading,body=''){return '<p class="eyebrow accent">'+kicker+'</p><h1 class="page-title" tabindex="-1">'+heading+'</h1><p class="muted intro">'+body+'</p>';}
function authLayout(content){return '<div class="auth-shell"><aside class="story">'+brand+'<div class="story-copy"><p class="eyebrow">SU VIDA, CONTIGO</p><h2>Las pequeñas cosas.<br>Una gran historia.</h2><p>Sus primeras veces. Vuestros mejores días.<br>Todos esos recuerdos que merecen quedarse.</p></div><div class="dog-scene"><div class="orbit"></div><img src="/dog.svg" alt="Ilustración de Paco dejando huella"><span class="memory-tag tag-two">Una vida llena de momentos</span></div></aside><main class="auth-main"><div class="mobile-brand">'+brand+'</div><div class="form-content">'+content+'</div><p class="fine">Paco dejando huella · Beta privada</p></main></div>';}
function setup(){return authLayout(title('ANTES DE EMPEZAR','Conectemos su historia.','La aplicación está preparada para Supabase, pero todavía falta configurar el proyecto.')+'<ol class="setup-list"><li>Crea el proyecto y ejecuta las dos migraciones SQL.</li><li>Configura el correo y las plantillas con código.</li><li>Completa el archivo .env y reinicia el servidor.</li></ol><p class="info-note">Consulta CONFIGURAR.md en la carpeta real. No se aceptan usuarios ni se simula el acceso mientras falte la conexión.</p><button class="primary" data-action="reload">Comprobar configuración ↗</button>');}
function auth(){
 let content='';
 if(state.screen==='welcome')content=title('BIENVENIDO A PACO DEJANDO HUELLA','Toda su vida.<br>Siempre cerca.','Guarda sus recuerdos y acompáñalo en cada etapa.')+'<button class="primary" data-screen="register">Empezar nuestra historia ↗</button><button class="secondary" data-screen="login">Ya tengo una cuenta</button>';
 if(state.screen==='login')content=back('welcome')+title('DE NUEVO EN CASA','Hola otra vez.','Accede a tus mascotas y a sus recuerdos.')+'<form id="login">'+field('email','Correo electrónico','email',state.email,'required autocomplete="email"')+password('password','Contraseña')+alerts()+submit('Entrar')+'</form><button class="text-button" data-screen="forgot">¿Olvidaste tu contraseña?</button><button class="text-button" data-screen="register">Crear una cuenta</button>';
 if(state.screen==='register')content=back('welcome')+title('VUESTRA HISTORIA EMPIEZA AQUÍ','Hagámoslo oficial.','Te enviaremos un enlace para confirmar tu correo.')+'<form id="register">'+field('email','Correo electrónico','email',state.email,'required autocomplete="email"')+password('password','Contraseña (mínimo 10 caracteres)')+'<label class="check"><input type="checkbox" required><span>Entiendo que esta es una beta privada y que los datos se guardarán en el servicio de Paco dejando huella. No introduciré información sensible.</span></label>'+alerts()+submit('Crear mi espacio')+'</form>';
 if(state.screen==='forgot')content=back('login')+title('NO PASA NADA','Recupera tu acceso.','Si existe una cuenta para ese correo, recibirás un enlace seguro para crear una contraseña nueva.')+'<form id="forgot">'+field('email','Correo electrónico','email',state.email,'required autocomplete="email"')+alerts()+submit('Enviar enlace')+'</form>';
 if(state.screen==='confirm')content=back('register')+title('REVISA TU CORREO','Un pequeño paso más.','Te enviamos un enlace de confirmación. Ábrelo en este navegador para entrar a Paco dejando huella.')+'<div class="email-pill">'+esc(state.email)+'</div><p class="info-note">Revisa también la carpeta de spam.</p><button class="primary" data-screen="login">Ya confirmé mi correo ↗</button><button class="text-button" data-action="resend">Reenviar enlace</button>';
 if(state.screen==='recovery-sent')content=back('forgot')+title('REVISA TU CORREO','Tu enlace está en camino.','Si existe una cuenta para este correo, abre el enlace que recibirás en este navegador para elegir una nueva contraseña.')+'<div class="email-pill">'+esc(state.email)+'</div><p class="info-note">Revisa también la carpeta de spam.</p><button class="text-button" data-action="resend">Reenviar enlace</button>';
 if(state.screen==='reset')content=title('VOLVAMOS A CASA','Una nueva contraseña.','Al terminar se cerrarán tus sesiones y podrás entrar de nuevo.')+'<form id="reset">'+password('password','Nueva contraseña')+password('confirm','Repetir contraseña')+alerts()+submit('Guardar contraseña')+'</form><button class="text-button" data-action="logout">Cancelar y salir</button>';
 return authLayout(content);
}
function petForm(){
 const p=state.editing?state.pet:null;
 const species=p?.species||'DOG';
 return title('SU PERFIL',p?'Los detalles importan.':'¿Quién te acompaña?','Empieza por lo esencial. Podrás añadir su foto después.')+'<form id="pet">'+field('name','Nombre','text',p?.name||'','required maxlength="80"')+'<label class="field"><span>Especie</span><select name="species">'+[['DOG','Perro'],['CAT','Gato'],['OTHER','Otra']].map(([v,l])=>'<option value="'+v+'" '+(species===v?'selected':'')+'>'+l+'</option>').join('')+'</select></label>'+field('birthDate','Fecha de nacimiento','date',p?.birth_date||'','required max="'+today()+'"')+'<label class="check"><input name="estimated" type="checkbox" '+(p?.estimated?'checked':'')+'>Es una fecha aproximada</label><div id="breed-field">'+breedField(species,p?.breed||'')+'</div><div class="two-fields">'+field('weight','Peso en kg (opcional)','number',p?.weight||'','min="0.1" max="120" step="0.1"')+'<label class="field"><span>Sexo</span><select name="gender">'+[['UNKNOWN','No lo sé'],['MALE','Macho'],['FEMALE','Hembra']].map(([v,l])=>'<option value="'+v+'" '+(p?.gender===v?'selected':'')+'>'+l+'</option>').join('')+'</select></label></div>'+alerts()+submit('Guardar mascota')+'</form>'+(state.pets.length?'<button class="text-button" data-action="cancel-pet">Cancelar</button>':'');
}
function breedField(species,current=''){
 const breeds=breedsForSpecies(species);
 if(!breeds.length)return field('breed','Raza o tipo (opcional)','text',current,'maxlength="80"');
 const listed=breeds.includes(current),choice=listed?current:(current?BREED_OTHER:'');
 return '<label class="field"><span>Raza (opcional)</span><select name="breed"><option value="">Selecciona una raza</option>'+breeds.map(b=>'<option value="'+esc(b)+'" '+(choice===b?'selected':'')+'>'+esc(b)+'</option>').join('')+'<option value="'+BREED_OTHER+'" '+(choice===BREED_OTHER?'selected':'')+'>Otra raza (escribir manualmente)</option></select></label><label class="field" data-custom-breed '+(choice===BREED_OTHER?'':'hidden')+'><span>Escribe la raza</span><input name="customBreed" type="text" value="'+esc(choice===BREED_OTHER?current:'')+'" maxlength="80" '+(choice===BREED_OTHER?'required':'')+'></label><p class="fine">Catálogo internacional · También puedes registrar cruces o razas no listadas.</p>';
}
function photoForm(kind,id,label){return '<form class="photo-form" data-kind="'+kind+'" data-id="'+id+'"><label class="field"><span>'+label+'</span><input aria-label="'+label+'" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required '+(!config.photosEnabled?'disabled':'')+'></label><button class="secondary" type="submit" '+(!config.photosEnabled?'disabled':'')+'>Guardar foto</button><p class="fine">JPEG, PNG o WebP · Máximo 8 MB · Foto privada</p><p class="photo-status notice" role="status">'+(!config.photosEnabled?'Falta configurar el servicio de fotografías.':'')+'</p></form>';}
function home(){
 const p=state.pet;
 const due=state.vaccinations.find(v=>['OVERDUE','DUE'].includes(vaccineReminder(v.next_due_on).kind));
 const reminder=due?'<button class="vaccine-alert" data-tab="health"><span>✚</span><div><strong>'+esc(due.vaccine_name)+'</strong><small>'+esc(vaccineReminder(due.next_due_on).label)+' · Revisa su cartilla</small></div><b>Ver salud →</b></button>':'';
 return '<div class="home-heading"><div>'+title('SU VIDA, CONTIGO','El mundo de '+esc(p.name)+'.')+'</div><button class="round-btn" data-action="edit" aria-label="Editar mascota">✎</button></div><section class="pet-hero"><div class="pet-details"><span class="private-pill">Tu compañero</span><h2>'+esc(p.name)+'</h2><p>'+esc(p.breed||({DOG:'Perro',CAT:'Gato',OTHER:'Mascota'}[p.species]))+'</p><span class="age-chip">'+esc(ageLabel(p.birth_date))+(p.estimated?' · aprox.':'')+'</span></div><img class="'+(p.photo?'pet-photo':'')+'" src="'+esc(p.photo||'/dog.svg')+'" alt="'+esc(p.photo?'Foto de '+p.name:'Ilustración provisional')+'"></section><div class="stats"><div><strong>'+state.memories.length+'</strong><span>recuerdos</span></div><div><strong>'+esc(p.weight?p.weight+' kg':'—')+'</strong><span>peso registrado</span></div><div><strong>♡</strong><span>vuestro espacio</span></div></div>'+reminder+photoForm('pet',p.id,p.photo_path?'Cambiar su fotografía':'Añadir su fotografía')+'<div class="journal-invite"><div><h3>¿Qué hizo especial el día de hoy?</h3><button class="inline-link" data-action="new-memory">Guardar un recuerdo →</button></div></div>';
}
function diary(){
 return title('LOS DÍAS QUE SE QUEDAN','Vuestro diario.','Los recuerdos de '+esc(state.pet.name)+', solo para ti.')+'<button class="primary" data-action="new-memory">Añadir recuerdo ↗</button>'+(state.memories.length?'<div class="timeline">'+state.memories.map(m=>'<article><p class="eyebrow accent">'+esc(m.event_date)+'</p><h2>'+esc(m.title)+'</h2>'+(m.photo?'<img class="memory-photo" src="'+esc(m.photo)+'" alt="'+esc(m.title)+'" loading="lazy">':m.photo_path?'<p class="notice">La foto no está disponible ahora. Actualiza para reintentar.</p>':'')+'<p>'+esc(m.note)+'</p><span class="private-label">Privado · '+esc(ageLabel(state.pet.birth_date,m.event_date))+'</span><details><summary>'+(m.photo_path?'Cambiar fotografía':'Añadir fotografía')+'</summary>'+photoForm('memory',m.id,'Foto del recuerdo')+'</details></article>').join('')+'</div>':'<div class="empty"><h2>Aquí empieza su historia.</h2><p>Guarda vuestro primer momento juntos.</p></div>');
}
function memoryForm(){return back('home')+title('UN MOMENTO VUESTRO','Que no se olvide.','Primero guardaremos el recuerdo. Después podrás añadir su fotografía.')+'<form id="memory">'+field('title','Título','text','','required maxlength="100"')+field('date','Fecha','date',today(),'required min="'+state.pet.birth_date+'" max="'+today()+'"')+'<label class="field"><span>Lo que quieres recordar</span><textarea name="note" rows="4" maxlength="1000"></textarea></label>'+alerts()+submit('Guardar recuerdo')+'</form>';}
function health(){
 const vaccines=state.vaccinations;
 return title('CUIDAMOS SU SALUD','Vacunas de '+esc(state.pet.name)+'.','Registra su historial y consulta las próximas dosis.')+'<button class="primary" data-action="new-vaccine">Añadir vacuna ↗</button>'+(vaccines.length?'<div class="vaccine-list">'+vaccines.map(v=>{const status=vaccineReminder(v.next_due_on);return '<article class="vaccine-card"><div><p class="eyebrow accent">'+esc(v.administered_on)+'</p><h2>'+esc(v.vaccine_name)+'</h2>'+(v.next_due_on?'<p class="vaccine-date">Próxima dosis: '+esc(v.next_due_on)+'</p>':'<p class="vaccine-date">Sin próxima dosis registrada</p>')+(v.notes?'<p class="vaccine-note">'+esc(v.notes)+'</p>':'')+'</div><div class="vaccine-actions">'+(status.kind!=='NONE'?'<span class="vaccine-status '+status.kind.toLowerCase()+'">'+esc(status.label)+'</span>':'')+'<button class="text-button" data-action="edit-vaccine" data-vaccine="'+v.id+'">Editar</button><button class="text-button danger" data-action="delete-vaccine" data-vaccine="'+v.id+'">Eliminar</button></div></article>';}).join('')+'</div>':'<div class="empty"><h2>Su cartilla empieza aquí.</h2><p>Registra la primera vacuna cuando la tengas a mano.</p></div>');
}
function vaccineForm(){
 const v=state.vaccineEditing;
 return back('home')+title('SU CARTILLA',v?'Edita esta vacuna.':'Añade una vacuna.','Guarda solo datos confirmados por su veterinario o su cartilla.')+'<form id="vaccine">'+field('vaccineName','Nombre de la vacuna','text',v?.vaccine_name||'','required maxlength="100"')+field('administeredOn','Fecha de aplicación','date',v?.administered_on||today(),'required min="'+state.pet.birth_date+'" max="'+today()+'"')+field('nextDueOn','Próxima dosis (opcional)','date',v?.next_due_on||'','min="'+state.pet.birth_date+'"')+'<label class="field"><span>Notas (opcional)</span><textarea name="notes" rows="4" maxlength="1000">'+esc(v?.notes||'')+'</textarea></label>'+alerts()+submit(v?'Guardar cambios':'Guardar vacuna')+'</form>';
}
function settings(){return title('A TU MANERA','Tu espacio.')+'<div class="settings-row"><span>Cuenta</span><strong>'+esc(state.user.email)+'</strong></div><p class="info-note">Tus datos se guardan en tu cuenta. Las fotos son privadas. Cerrar sesión elimina los datos de la pantalla, pero conserva tus recuerdos en la base de datos.</p><button class="secondary" data-action="export">Exportar mis datos</button><button class="secondary" data-action="logout">Cerrar sesión en todos mis dispositivos</button><p class="fine">Beta privada. Fotos HEIC, suscripciones, notificaciones y aplicaciones nativas aún no incluidas.</p>';}
function shell(content){
 return '<div class="product-shell"><header class="product-header">'+brand+'<span class="demo-badge">BETA</span></header><main class="product-main">'+(state.pets.length&&state.screen==='home'?'<label class="field pet-selector"><span>Tu mascota</span><select id="pet-selector">'+state.pets.map(p=>'<option value="'+p.id+'" '+(p.id===state.pet?.id?'selected':'')+'>'+esc(p.name)+'</option>').join('')+'</select></label><button class="text-button" data-action="new-pet">Añadir otra mascota</button>':'')+content+(state.screen==='home'?alerts():'')+'</main>'+(state.screen==='home'?'<nav class="bottom-nav" aria-label="Navegación">'+[['home','⌂','Mascota'],['diary','▤','Diario'],['health','✚','Salud'],['settings','☷','Ajustes']].map(([tab,icon,label])=>'<button data-tab="'+tab+'" '+(state.tab===tab?'aria-current="page"':'')+'><span aria-hidden="true">'+icon+'</span>'+label+'</button>').join('')+'</nav>':'')+'</div>';
}
function render(){
 if(state.screen==='setup'){app.innerHTML=setup();return;}
 if(state.screen==='loading'){app.innerHTML=authLayout(title('UN MOMENTO','Preparando su espacio…'));return;}
 if(state.screen==='load-error'){app.innerHTML=authLayout(title('VOLVAMOS A INTENTARLO','No pudimos cargar tus datos.')+alerts()+'<button class="primary" data-action="refresh">Reintentar</button><button class="secondary" data-action="logout">Cerrar sesión</button>');return;}
 const content=state.screen==='onboarding'?petForm():state.screen==='memory'?memoryForm():state.screen==='vaccine'?vaccineForm():state.screen==='home'?({home,diary,health,settings}[state.tab])():null;
 app.innerHTML=content?shell(content):auth();
 document.querySelector('h1')?.focus({preventScroll:true});
}
function showError(error,text){state.error=text||message(error);const e=document.querySelector('#error');if(e){e.textContent=state.error;e.hidden=false;}else render();}
function go(screen){state.error='';state.notice='';state.screen=screen;render();window.scrollTo(0,0);}
function clearPrivate(){state.user=null;state.pets=[];state.pet=null;state.memories=[];state.vaccinations=[];state.email='';state.recovery=false;}
async function load(){
 const user=await api.user();if(!user){clearPrivate();go('login');return;}
 state.user=user;state.screen='loading';render();
 try{
  const pets=await api.pets();
  // Do not restore data if sign-out occurred while the request was in flight.
  if(!state.user||state.user.id!==user.id)return;
  state.pets=pets;
  if(!pets.length){state.editing=false;state.petRequestId=crypto.randomUUID();go('onboarding');return;}
  state.pet=pets.find(p=>p.id===state.pet?.id)||pets[0];
  await loadPet();
 }catch(e){state.screen='load-error';state.error=message(e);render();}
}
async function loadPet(){
 const userId=state.user?.id,pet=state.pet;
 if(!pet)return;
 const [memories,vaccinations,photo]=await Promise.all([api.memories(pet.id),api.vaccinations(pet.id),api.signedPhoto(pet.photo_path)]);
 const enriched=await Promise.all(memories.map(async m=>({...m,photo:await api.signedPhoto(m.photo_path)})));
 if(state.user?.id!==userId||state.pet?.id!==pet.id)return;
 state.pet={...pet,photo};state.memories=enriched;state.vaccinations=vaccinations;state.screen='home';state.error='';render();
}
async function busy(form,work){
 if(state.busy)return;state.busy=true;form?.setAttribute('aria-busy','true');
 const controls=[...(form?.querySelectorAll('button')||[])];const old=controls.map(b=>b.disabled);controls.forEach(b=>b.disabled=true);
 try{await work();}catch(e){showError(e);}finally{state.busy=false;form?.removeAttribute('aria-busy');controls.forEach((b,i)=>b.disabled=old[i]);}
}
app.addEventListener('submit',event=>{
 event.preventDefault();const form=event.target,data=new FormData(form);
 busy(form,async()=>{
  if(form.classList.contains('photo-form')){
   const status=form.querySelector('.photo-status');status.textContent='Procesando y guardando foto…';
   try{await api.upload(form.dataset.kind,form.dataset.id,data.get('photo'));await load();state.notice='Fotografía guardada.';render();}
   catch(e){status.textContent=message(e);status.setAttribute('role','alert');}
   return;
  }
  const email=String(data.get('email')||'').trim().toLowerCase();
  if(form.id==='login'){state.email=email;try{await api.login(email,String(data.get('password')));}catch{showError(null,'No se pudo iniciar sesión. Revisa tus datos, confirma tu correo e inténtalo de nuevo.');return;}form.reset();await load();}
  if(form.id==='register'){
   state.email=email;await api.register(email,String(data.get('password')));form.reset();state.purpose='signup';state.lastSend=Date.now();go('confirm');
  }
  if(form.id==='forgot'){state.email=email;await api.recover(email);state.purpose='recovery';state.lastSend=Date.now();go('recovery-sent');}
  if(form.id==='reset'){
   if(!state.recovery){showError(null,'Verifica primero tu código de recuperación.');return;}
   if(data.get('password')!==data.get('confirm')){showError(null,'Las contraseñas no coinciden.');return;}
   await api.reset(String(data.get('password')));form.reset();clearPrivate();go('login');state.notice='Contraseña actualizada. Inicia sesión de nuevo.';render();
  }
  if(form.id==='pet'){
   const p=Object.fromEntries(data);p.estimated=data.has('estimated');if(p.breed===BREED_OTHER)p.breed=String(p.customBreed||'').trim();delete p.customBreed;const error=petError(p);if(error){showError(null,error);return;}
   const record=await api.savePet(p,state.petRequestId,state.editing);state.pet=record;state.tab='home';await load();
  }
  if(form.id==='memory'){
   const m=Object.fromEntries(data);if(!m.title.trim()){showError(null,'Escribe un título.');return;}
   await api.saveMemory({...m,petId:state.pet.id},state.memoryRequestId);state.tab='diary';await loadPet();state.notice='Recuerdo guardado. Puedes añadirle una fotografía.';render();
  }
  if(form.id==='vaccine'){
   const v=Object.fromEntries(data),error=vaccineError(v,state.pet.birth_date);if(error){showError(null,error);return;}
   await api.saveVaccination({...v,petId:state.pet.id},state.vaccineRequestId,Boolean(state.vaccineEditing));state.vaccineEditing=null;state.tab='health';await loadPet();state.notice='Vacuna guardada.';render();
  }
 });
});
app.addEventListener('click',event=>{
 const b=event.target.closest('button');if(!b||state.busy)return;
 if(b.dataset.show){const input=document.querySelector('[name="'+b.dataset.show+'"]');input.type=input.type==='password'?'text':'password';b.textContent=input.type==='password'?'Mostrar contraseña':'Ocultar contraseña';return;}
 if(b.dataset.screen){go(b.dataset.screen);return;}
 if(b.dataset.tab){state.tab=b.dataset.tab;go('home');return;}
 busy(null,async()=>{
  switch(b.dataset.action){
   case 'reload':location.reload();break;
   case 'refresh':await load();break;
   case 'logout':await api.logout();clearPrivate();go('login');break;
   case 'resend':if(Date.now()-state.lastSend<60000){showError(null,'Espera un minuto antes de solicitar otro código.');return;}await api.resend(state.email,state.purpose);state.lastSend=Date.now();state.notice='Si la solicitud procede, recibirás un nuevo código.';state.error='';render();break;
   case 'new-pet':state.editing=false;state.petRequestId=crypto.randomUUID();go('onboarding');break;
   case 'edit':state.editing=true;state.petRequestId=state.pet.id;go('onboarding');break;
   case 'cancel-pet':go('home');break;
   case 'new-memory':state.memoryRequestId=crypto.randomUUID();go('memory');break;
   case 'new-vaccine':state.vaccineEditing=null;state.vaccineRequestId=crypto.randomUUID();go('vaccine');break;
   case 'edit-vaccine':{
    const vaccine=state.vaccinations.find(v=>v.id===b.dataset.vaccine);if(!vaccine){showError(null,'No encontramos esa vacuna. Actualiza e inténtalo de nuevo.');return;}
    state.vaccineEditing=vaccine;state.vaccineRequestId=vaccine.id;go('vaccine');break;
   }
   case 'delete-vaccine':{
    const vaccine=state.vaccinations.find(v=>v.id===b.dataset.vaccine);if(!vaccine){showError(null,'No encontramos esa vacuna. Actualiza e inténtalo de nuevo.');return;}
    if(!window.confirm('¿Eliminar '+vaccine.vaccine_name+' de su cartilla?'))return;
    await api.deleteVaccination(vaccine.id);await loadPet();state.notice='Vacuna eliminada.';render();break;
   }
   case 'export':{
    const pets=await api.pets();const items=await Promise.all(pets.map(async p=>({pet:p,memories:await api.memories(p.id)})));
    const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),items},null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='paco-dejando-huella-datos-'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);state.notice='Datos exportados. Las fotografías no se incluyen en este archivo JSON.';render();break;
   }
  }
 });
});
app.addEventListener('change',event=>{
 if(event.target.id==='pet-selector'){const id=event.target.value;busy(null,async()=>{state.pet=state.pets.find(p=>p.id===id);await loadPet();});return;}
 if(event.target.name==='species'){document.querySelector('#breed-field').innerHTML=breedField(event.target.value);return;}
 if(event.target.name==='breed'){
  const custom=document.querySelector('[data-custom-breed]');if(!custom)return;
  const enabled=event.target.value===BREED_OTHER;custom.hidden=!enabled;const input=custom.querySelector('input');input.required=enabled;if(!enabled)input.value='';
 }
});
async function start(){
 try{
  const response=await fetch('/api/config');if(!response.ok)throw Error();config=await response.json();
  config.authRedirectTo=authRedirectOrigin(config.origin);
  if(!config.configured){state.screen='setup';render();return;}
  // This browser-only import keeps server credentials and the Node dependency out of the client bundle.
  const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.116.0');
  api=createBackend(config,null,createClient);
  api.client.auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY'){state.recovery=true;go('reset');}if(event==='SIGNED_OUT'){clearPrivate();go('login');}});
  const user=await api.user();if(state.recovery)return;if(user)await load();else go('welcome');
 }catch{state.screen='setup';render();}
}
start();

