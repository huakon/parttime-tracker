// =============== 公司和Logo管理 ===============
// 负责公司列表和Logo的管理

// ========== 公司管理部分 ==========
document.addEventListener('DOMContentLoaded', () => {
  const companySelect = document.getElementById('d_company');
  const newCompanyInput = document.getElementById('new_company');
  const addBtn = document.getElementById('addCompanyBtn');

  // 从 API 加载所有公司列表
  async function loadCompanies() {
    try {
      const res = await fetch(APP.apiBase + '?action=get_companies');
      const data = await res.json();
      if (data.ok && Array.isArray(data.rows)) {
        companySelect.innerHTML = '<option value="">选择公司</option>';
        data.rows.forEach(name => {
          const opt = document.createElement('option');
          opt.value = name;
          opt.textContent = name;
          companySelect.appendChild(opt);
        });
      } else {
        companySelect.innerHTML = '<option value="">选择公司</option>';
      }
    } catch (e) {
    }
  }

  if (addBtn) {
    addBtn.addEventListener('click', async () => {
      const name = newCompanyInput.value.trim();
      if (!name) return showNotification('请输入公司名', 'error');
      
      await loadCompanies();
      
      if (![...companySelect.options].some(o => o.value === name)) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        companySelect.appendChild(opt);
      }
      companySelect.value = name;
      newCompanyInput.value = '';
      showNotification('添加成功，请保存条目', 'success');
    });
  }

  // 初始化加载
  loadCompanies();
});

// ========== Logo管理部分 ==========
document.addEventListener('DOMContentLoaded', () => {
  const logoModal = document.getElementById('logoModal');
  const closeLogoBtn = document.getElementById('closeLogoModal');
  const menuLogoBtn = document.getElementById('menuLogo');
  const addLogoBtn = document.getElementById('addLogoBtn');
  const menuDropdown = document.getElementById('menuDropdown');

  // 打开 Logo 管理弹窗
  if (menuLogoBtn) {
    menuLogoBtn.addEventListener('click', async () => {
      logoModal.style.display = 'flex';
      if (menuDropdown) menuDropdown.style.display = 'none';
      await loadLogos();
    });
  }

  // 关闭 Logo 管理弹窗
  if (closeLogoBtn) {
    closeLogoBtn.addEventListener('click', () => {
      logoModal.style.display = 'none';
    });
  }

  // 点击背景关闭
  if (logoModal) {
    logoModal.addEventListener('click', (e) => {
      if (e.target === logoModal) {
        logoModal.style.display = 'none';
      }
    });
  }

  // 添加 Logo
  if (addLogoBtn) {
    addLogoBtn.addEventListener('click', async () => {
      const company = document.getElementById('logoCompanyInput').value.trim();
      const logoUrl = document.getElementById('logoUrlInput').value.trim();

      if (!company) {
        showNotification('请输入公司名', 'error');
        return;
      }

      if (!logoUrl) {
        showNotification('请输入 Logo URL', 'error');
        return;
      }

      try {
        const res = await fetch('../api.php', {
          method: 'POST',
          body: new URLSearchParams({
            action: 'logo_set',
            csrf_token: getCsrfToken(),
            company: company,
            url: logoUrl
          })
        });

        const result = await res.json();

        if (result.ok) {
          showNotification('Logo 添加成功', 'success');
          document.getElementById('logoCompanyInput').value = '';
          document.getElementById('logoUrlInput').value = '';
          await loadLogos();
          
          // 更新全局 Logo 缓存
          if (window.APP && window.APP.companyLogos) {
            window.APP.companyLogos[company] = logoUrl;
          }
          
          // 刷新日历显示
          try {
            loadCalendar(currentYear, currentMonth);
            renderMobileList(currentYear, currentMonth);
          } catch (e) {}
        } else {
          showNotification('添加失败: ' + (result.error || '未知错误'), 'error');
        }
      } catch (e) {
        showNotification('添加失败: ' + e.message, 'error');
      }
    });
  }

  // 加载所有 Logo
  async function loadLogos() {
    try {
      const res = await fetch('../api.php?action=logo_list');
      const result = await res.json();

      const logoList = document.getElementById('logoList');
      if (!logoList) return;

      logoList.innerHTML = '';

      if (result.ok && result.data && result.data.length > 0) {
        result.data.forEach(item => {
          const logoCard = document.createElement('div');
          logoCard.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px;
            background: #f9f9f9;
            border-radius: 6px;
            border: 1px solid #e0e0e0;
          `;

          logoCard.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
              <img src="${item.logo_url}" style="height: 24px; object-fit: contain;" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22><text y=%2218%22 font-size=%2220%22>❌</text></svg>'">
              <div>
                <div style="font-weight: 600;">${item.company}</div>
                <div style="font-size: 11px; color: #666; word-break: break-all;">${item.logo_url}</div>
              </div>
            </div>
            <button class="btn small" data-company="${item.company}" style="background: #ff3b30; color: white;">删除</button>
          `;

          const deleteBtn = logoCard.querySelector('button');
          deleteBtn.addEventListener('click', async () => {
            if (!confirm(`确认删除 ${item.company} 的 Logo？`)) return;

            try {
              const res = await fetch('../api.php', {
                method: 'POST',
                body: new URLSearchParams({
                  action: 'logo_delete',
                  csrf_token: getCsrfToken(),
                  company: item.company
                })
              });

              const result = await res.json();

              if (result.ok) {
                showNotification('已删除', 'success');
                await loadLogos();
                
                // 更新全局 Logo 缓存
                if (window.APP && window.APP.companyLogos) {
                  delete window.APP.companyLogos[item.company];
                }
                
                // 刷新日历
                try {
                  loadCalendar(currentYear, currentMonth);
                  renderMobileList(currentYear, currentMonth);
                } catch (e) {}
              } else {
                showNotification('删除失败: ' + (result.error || '未知错误'), 'error');
              }
            } catch (e) {
              showNotification('删除失败: ' + e.message, 'error');
            }
          });

          logoList.appendChild(logoCard);
        });
      } else {
        logoList.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">暂无 Logo</div>';
      }
    } catch (e) {
      showNotification('加载失败: ' + e.message, 'error');
    }
  }
});
