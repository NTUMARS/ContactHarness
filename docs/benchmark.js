document.querySelectorAll('[data-benchmark-task]').forEach(link=>link.addEventListener('click',event=>{
 if(!window.ContactHarnessSimulation)return;
 event.preventDefault();window.ContactHarnessSimulation.select(Number(link.dataset.benchmarkTask));
 history.replaceState(null,'','#experiments');
}));
