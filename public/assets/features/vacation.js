// vacation.js - 休假管理的前端逻辑，供 public/index.php 使用
// 使用 local vacation API: public/vacation/api.php
const VAC_API_BASE = 'vacation/api.php';

function showVacModal(){
  const m = document.getElementById('vacModal');
  if(m) m.style.display = 'flex';
}
function hideVacModal(){
  const m = document.getElementById('vacModal');
  if(m) m.style.display = 'none';
}

async function loadVacationsInto(elTableId = 'vacList', elMobileId = 'mobileUI'){
  try{
    const res = await fetch(VAC_API_BASE + '?action=list');
    const js = await res.json();
    const tbody = document.getElementById(elTableId);
    const mobileDiv = document.getElementById(elMobileId);
    if(tbody){
      // 清空但保留 header
      tbody.innerHTML = '<tr><th>开始</th><th>结束</th><th>备注</th><th>操作</th></tr>';
    }
    if(mobileDiv) mobileDiv.innerHTML = '';
    if(js && js.ok){
      js.vacations.forEach(v=>{
        if(tbody){
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${v.start_date}</td><td>${v.end_date}</td><td>${v.note||''}</td>
            <td><button class="btn small" data-id="${v.id}" data-action="del">删除</button></td>`;
          tbody.appendChild(tr);
        }
        if(mobileDiv){
          const card = document.createElement('div');
          card.className = 'card';
          card.innerHTML = `<div>开始: ${v.start_date}</div>
                            <div>结束: ${v.end_date}</div>
                            <div>备注: ${v.note||''}</div>
                            <button class="btn small" data-id="${v.id}" data-action="del">删除</button>`;
          mobileDiv.appendChild(card);
        }
      });
    }
  }catch(e){
    showNotification('加载休假列表失败', 'error');
  }
}

async function delVac(id){
  if(!confirm('确认删除该休假记录？')) return;
  try{
    const res = await fetch(VAC_API_BASE + '?action=delete', {
      method: 'POST',
      body: new URLSearchParams({id})
    });
    const js = await res.json();
    if(js.ok) loadVacationsInto();
    else showNotification(js.msg || '删除失败', 'error');
  }catch(e){
    showNotification('删除失败', 'error');
  }
}

async function addVac(form){
  try{
    const fd = new FormData(form);
    const res = await fetch(VAC_API_BASE + '?action=add', {
      method: 'POST',
      body: fd
    });
    const js = await res.json();
    if(js.ok){
      form.reset();
      loadVacationsInto();
    } else showNotification(js.msg || '添加失败', 'error');
  }catch(e){
    showNotification('添加休假失败', 'error');
  }
}

// 事件委托处理删除按钮
function vacDelegateClicks(e){
  const t = e.target;
  const act = t.getAttribute && t.getAttribute('data-action');
  const id = t.getAttribute && t.getAttribute('data-id');
  if(act==='del' && id){
    delVac(id);
  }
}

function initVacHandlers(){
  const openBtns = ['menuVacation','vacationOpenBtn'];
  openBtns.forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener('click', showVacModal);
  });

  const closeBtn = document.getElementById('closeVac');
  if(closeBtn) closeBtn.addEventListener('click', hideVacModal);

  const vacModal = document.getElementById('vacModal');
  if(vacModal){
    vacModal.addEventListener('click', (e)=>{ if(e.target===vacModal) hideVacModal(); });
  }

  const form = document.getElementById('vacForm');
  if(form){
    form.onsubmit = async (e)=>{ e.preventDefault(); await addVac(e.target); };
  }

  // 事件委托到容器
  document.addEventListener('click', (e)=>{
    if(e.target && e.target.getAttribute && e.target.getAttribute('data-action')){
      vacDelegateClicks(e);
    }
  });

  // 初次加载列表（当模态打开时也会刷新）
  loadVacationsInto();
}

// 初始化
document.addEventListener('DOMContentLoaded', ()=>{
  initVacHandlers();
});
