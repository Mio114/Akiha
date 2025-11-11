---
title: "联系我们"
date: 2024-01-15
---

<div class="contact-content">
  <!-- 联系信息 -->
  <section class="contact-info">
    <h2>联系方式</h2>
    <div class="contact-item">
      <h3>📧 内容建议</h3>
      <p>content@akihafield.com</p>
      <p>接收游戏收录建议和内容反馈</p>
    </div>
    <div class="contact-item">
      <h3>🔧 技术支持</h3>
      <p>support@akihafield.com</p>
      <p>网站使用问题和功能建议</p>
    </div>
    <div class="contact-item">
      <h3>🤝 合作咨询</h3>
      <p>cooperation@akihafield.com</p>
      <p>游戏会社合作与内容授权</p>
    </div>
    <div class="contact-item">
      <h3>📝 内容提交</h3>
      <p>submit@akihafield.com</p>
      <p>提交新的Galgame信息或修正内容</p>
    </div>
  </section>

  <!-- 联系表单 -->
  <section class="contact-form">
    <h2>发送消息</h2>
    <form id="contactForm">
      <div class="form-group">
        <label for="name">您的称呼</label>
        <input type="text" id="name" required placeholder="请输入您的名字">
      </div>
      <div class="form-group">
        <label for="email">电子邮箱</label>
        <input type="email" id="email" required placeholder="请输入您的邮箱">
      </div>
      <div class="form-group">
        <label for="subject">咨询类型</label>
        <select id="subject" required>
          <option value="">请选择咨询类型</option>
          <option value="content">内容建议</option>
          <option value="support">技术支持</option>
          <option value="cooperation">合作咨询</option>
          <option value="submit">内容提交</option>
          <option value="other">其他</option>
        </select>
      </div>
      <div class="form-group">
        <label for="message">详细内容</label>
        <textarea id="message" required placeholder="请详细描述您想咨询的内容..."></textarea>
      </div>
      <button type="submit" class="submit-btn">发送消息</button>
    </form>
  </section>
</div>

<!-- 常见问题 -->
<section class="faq-section">
  <h2>常见问题</h2>
  <div class="faq-grid">
    <div class="faq-item">
      <h3>如何提交新的游戏信息？</h3>
      <p>欢迎通过内容提交邮箱或联系表单提交新的Galgame信息，我们会尽快审核并添加到游戏库中。</p>
    </div>
    <div class="faq-item">
      <h3>发现游戏信息有误怎么办？</h3>
      <p>如果您发现游戏信息有误，请通过内容建议邮箱或技术支持邮箱联系我们，我们会及时修正。</p>
    </div>
    <div class="faq-item">
      <h3>回复需要多长时间？</h3>
      <p>我们会在3-5个工作日内回复您的邮件。内容提交类信息可能需要更长时间审核，感谢您的耐心等待。</p>
    </div>
    <div class="faq-item">
      <h3>可以申请删除游戏信息吗？</h3>
      <p>如果您是游戏版权方并希望删除相关信息，请通过合作咨询邮箱联系我们，我们会及时处理。</p>
    </div>
  </div>
</section>

<script>
document.getElementById('contactForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const name = document.getElementById('name').value;
  const subject = document.getElementById('subject').value;
  
  if (!subject) {
    alert('请选择咨询类型');
    return;
  }
  
  alert(`感谢 ${name} 的留言！我们会尽快回复您。`);
  this.reset();
});
</script>