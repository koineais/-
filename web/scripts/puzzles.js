// 詰将棋：簡易自動判定版
(()=>{
  const puzzles = [
    {
      id:1,
      title:'1手詰 — 飛車で詰む',
      desc:'黒玉が1段目にいます。飛車(5二)から指し手を入力してください。',
      answer:'52→51' // 飛車が5二から5一へ移動
    },
    {
      id:2,
      title:'1手詰 — 角で詰む',
      desc:'黒玉が8八にいます。角の一手で詰みます。',
      answer:'33→88'
    }
  ];

  const container = document.getElementById('puzzles');
  if(!container) return;

  puzzles.forEach((p, idx)=>{
    const card = document.createElement('div'); card.className='puzzle';
    const h = document.createElement('h3'); h.textContent = `${p.id}. ${p.title}`;
    const d = document.createElement('p'); d.textContent = p.desc;
    
    const input = document.createElement('input');
    input.type='text';
    input.className='answer-input';
    input.placeholder='例: 52→51 （行→列）';
    input.dataset.answer = p.answer.toLowerCase();
    
    const btn = document.createElement('button');
    btn.textContent = '判定';
    btn.addEventListener('click', ()=>{
      const ans = input.value.trim().toLowerCase();
      const result = document.getElementById(`result-${idx}`);
      const isCorrect = ans === input.dataset.answer;
      result.className = 'result ' + (isCorrect? 'correct':'wrong');
      result.textContent = isCorrect? '✓ 正解！': `✗ 不正解。答え: ${input.dataset.answer}`;
    });
    
    const result = document.createElement('div');
    result.id = `result-${idx}`;
    
    card.appendChild(h); card.appendChild(d);
    card.appendChild(input); card.appendChild(btn);
    card.appendChild(result);
    container.appendChild(card);
  });
})();
