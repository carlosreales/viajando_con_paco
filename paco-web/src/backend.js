export function message(error){
 const text=String(error?.message||error?.error||'');
 if(text.includes('PACO_PET_LIMIT'))return 'Esta beta admite dos mascotas por cuenta.';
 if(text.includes('PACO_MEMORY_LIMIT'))return 'Has alcanzado el límite de recuerdos de esta beta.';
 if(text.includes('PACO_BIRTH_AFTER_MEMORY'))return 'Hay recuerdos anteriores a esa fecha de nacimiento.';
 if(text.includes('PACO_INVALID_VACCINATION_DATE'))return 'La fecha de aplicación debe estar entre su nacimiento y hoy.';
 if(text.includes('PACO_INVALID_VACCINATION_DUE_DATE'))return 'La próxima dosis no puede ser anterior a la aplicación.';
 if(text.includes('PACO_INVALID_DATE'))return 'Revisa la fecha: no puede ser futura ni anterior al nacimiento.';
 if(text.includes('PHOTO_TOO_LARGE'))return 'La fotografía supera los 8 MB.';
 if(text.includes('PHOTO_FORMAT')||text.includes('PHOTO_INVALID'))return 'Usa una fotografía JPEG, PNG o WebP válida, sin animación.';
 if(text.includes('PHOTOS_NOT_CONFIGURED'))return 'Falta configurar el servicio privado de fotografías.';
 if(text.includes('TRY_LATER'))return 'Hay varias cargas en curso. Espera un momento y vuelve a intentarlo.';
 if(text.includes('UNAUTHENTICATED')||error?.status===401)return 'Tu sesión ha caducado. Vuelve a iniciar sesión.';
 return 'No se pudo completar la operación. Revisa tu conexión e inténtalo de nuevo.';
}
function checked(result){if(result.error)throw result.error;return result.data;}
export function createBackend(config,injected,createClient){
 if(!injected&&typeof createClient!=='function')throw Error('SUPABASE_CLIENT_UNAVAILABLE');
 const client=injected||createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}});
 return {
  client,
  async user(){const {data,error}=await client.auth.getUser();return error?null:data.user;},
  async login(email,password){return checked(await client.auth.signInWithPassword({email,password}));},
  async register(email,password){
   const result=await client.auth.signUp({email,password,options:{emailRedirectTo:config.origin}});
   if(result.data?.session){await client.auth.signOut();throw Error('EMAIL_CONFIRMATION_REQUIRED');}
   return checked(result);
  },
  async verify(email,token,purpose){return checked(await client.auth.verifyOtp({email,token,type:purpose==='recovery'?'recovery':'signup'}));},
  async recover(email){return checked(await client.auth.resetPasswordForEmail(email,{redirectTo:config.origin}));},
  async resend(email,purpose){return purpose==='recovery'?checked(await client.auth.resetPasswordForEmail(email,{redirectTo:config.origin})):checked(await client.auth.resend({type:'signup',email,options:{emailRedirectTo:config.origin}}));},
  async reset(password){checked(await client.auth.updateUser({password}));checked(await client.auth.signOut({scope:'global'}));},
  async logout(){checked(await client.auth.signOut({scope:'global'}));},
  async pets(){return checked(await client.from('paco_pets').select('*').order('created_at'));},
  async savePet(p,id,editing){
   const body={name:p.name.trim(),species:p.species,birth_date:p.birthDate,estimated:p.estimated,breed:p.breed||'',gender:p.gender||'UNKNOWN',weight:p.weight?Number(p.weight):null};
   if(editing)return checked(await client.from('paco_pets').update(body).eq('id',id).select().single());
   const result=await client.from('paco_pets').insert({...body,id}).select().single();
   if(result.error?.code==='23505')return checked(await client.from('paco_pets').update(body).eq('id',id).select().single());
   return checked(result);
  },
  async memories(petId){return checked(await client.from('paco_memories').select('*').eq('pet_id',petId).order('event_date',{ascending:false}).order('id').limit(500));},
  async saveMemory(p,id){
   const body={pet_id:p.petId,title:p.title.trim(),event_date:p.date,note:p.note||''};
   const result=await client.from('paco_memories').insert({...body,id}).select().single();
   if(result.error?.code==='23505')return checked(await client.from('paco_memories').select('*').eq('id',id).single());
   return checked(result);
  },
  async vaccinations(petId){return checked(await client.from('paco_vaccinations').select('*').eq('pet_id',petId).order('next_due_on',{ascending:true,nullsFirst:false}).order('administered_on',{ascending:false}).order('id'));},
  async saveVaccination(v,id,editing){
   const body={vaccine_name:v.vaccineName.trim(),administered_on:v.administeredOn,next_due_on:v.nextDueOn||null,notes:v.notes||''};
   if(editing)return checked(await client.from('paco_vaccinations').update(body).eq('id',id).select().single());
   const result=await client.from('paco_vaccinations').insert({...body,id,pet_id:v.petId}).select().single();
   if(result.error?.code==='23505')return checked(await client.from('paco_vaccinations').select('*').eq('id',id).single());
   return checked(result);
  },
  async deleteVaccination(id){return checked(await client.from('paco_vaccinations').delete().eq('id',id));},
  async signedPhoto(path){if(!path)return '';const result=await client.storage.from('paco-photos').createSignedUrl(path,600);return result.error?'':result.data.signedUrl;},
  async upload(kind,id,file){
   if(!file||file.size>8388608)throw Error('PHOTO_TOO_LARGE');
   const {data}=await client.auth.getSession();
   if(!data.session)throw Error('UNAUTHENTICATED');
   const response=await fetch('/api/photos?kind='+kind+'&id='+encodeURIComponent(id),{method:'POST',headers:{Authorization:'Bearer '+data.session.access_token,'Content-Type':'application/octet-stream'},body:file});
   const result=await response.json();if(!response.ok)throw Error(result.error);return result;
  }
 };
}

