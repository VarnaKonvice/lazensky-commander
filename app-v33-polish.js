function lkV33GenericNextLabels(){
  document.querySelectorAll('.full').forEach(function(el){
    el.innerHTML = el.innerHTML
      .replace('Dnešek hotový · další jídlo:', 'Dnešek hotový · následuje:')
      .replace('Dnešek hotový · další procedura:', 'Dnešek hotový · následuje:');
  });
  document.querySelectorAll('.detail span, .next .k').forEach(function(el){
    var text = el.textContent || '';
    text = text
      .replace(/^Další jídla/i, 'Následuje')
      .replace(/^Další jídlo/i, 'Následuje')
      .replace(/^Další procedury/i, 'Následuje')
      .replace(/^Další procedura/i, 'Následuje')
      .replace(/^Potom jídlo/i, 'Potom')
      .replace(/^Potom procedura/i, 'Potom');
    el.textContent = text;
  });
}
window.addEventListener('load', lkV33GenericNextLabels);
setTimeout(lkV33GenericNextLabels, 100);
setTimeout(lkV33GenericNextLabels, 600);
setInterval(lkV33GenericNextLabels, 1000);
