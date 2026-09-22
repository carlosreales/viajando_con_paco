export function dateValid(value) {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(value||'')) return false;
 const d=new Date(value+'T00:00:00Z');
 return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;
}
export function today() {
 const d=new Date(); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
}
export function petError(p,now=today()) {
 if(!p.name?.trim()||p.name.trim().length>80)return 'Escribe su nombre (máximo 80 caracteres).';
 if(!['DOG','CAT','OTHER'].includes(p.species))return 'Selecciona una especie.';
 const oldest=String(Number(now.slice(0,4))-40)+now.slice(4);
 if(!dateValid(p.birthDate)||p.birthDate>now||p.birthDate<oldest)return 'Elige una fecha válida entre hoy y hace 40 años.';
 if(p.weight&&(!Number.isFinite(Number(p.weight))||Number(p.weight)<0.1||Number(p.weight)>120))return 'El peso debe estar entre 0,1 y 120 kg.';
 return '';
}
export function ageLabel(birth,now=today()) {
 if(!dateValid(birth)||birth>now)return '';
 const [by,bm,bd]=birth.split('-').map(Number),[y,m,d]=now.split('-').map(Number);
 const anniversary=Math.min(bd,new Date(Date.UTC(y,m,0)).getUTCDate());
 const months=(y-by)*12+m-bm-(d<anniversary?1:0);
 const days=Math.floor((Date.parse(now)-Date.parse(birth))/86400000);
 if(months<1)return days+(days===1?' día':' días');
 if(months<3)return Math.floor(days/7)+' semanas';
 if(months<24)return months+' meses';
 return Math.floor(months/12)+' años'+(months%12?' y '+months%12+' meses':'');
}
export function codeError(code,expires,now=Date.now()) {
 if(now>=expires)return 'Este código ha caducado. Solicita uno nuevo.';
 return code==='123456'?'':'El código no coincide. Prueba con 123456.';
}
export function escapeHtml(v) { return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

