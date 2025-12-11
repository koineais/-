// 簡易将棋盤スクリプト（合法手チェック・持駒表示あり）
(()=>{
  const piecesMap = {
    P:'歩',L:'香',N:'桂',S:'銀',G:'金',K:'玉',B:'角',R:'飛',
    p:'歩',l:'香',n:'桂',s:'銀',g:'金',k:'玉',b:'角',r:'飛'
  };

  const grid = document.getElementById('shogi-grid');
  let selected = null;
  let board = Array.from({length:9},()=>Array(9).fill(''));
  let flipped = false;
  let captured = {upper:[], lower:[]};

  let currentLegal = new Set();
  function coordKey(r,c){return `${r},${c}`}

  function render(){
    grid.innerHTML='';
    for(let r=0;r<9;r++){
      const tr = document.createElement('tr');
      for(let c=0;c<9;c++){
        const td = document.createElement('td');
        const rr = flipped?8-r:r;
        const cc = flipped?8-c:c;
        const val = board[rr][cc];
        td.dataset.r = rr; td.dataset.c = cc;
        td.textContent = val? (piecesMap[val] || val) : '';
        if(val) td.classList.add('piece');
        if(val && isUpperPiece(val)) td.classList.add('white');
        else if(val) td.classList.add('black');
        // ハイライト: 合法手
        if(currentLegal.has(coordKey(rr,cc))) td.classList.add('legal');
        td.addEventListener('click', onCellClick);
        if(selected && selected.r==rr && selected.c==cc) td.style.outline='3px solid rgba(31,111,235,0.4)';
        tr.appendChild(td);
      }
      grid.appendChild(tr);
    }
    // 持駒表示
    const upper = document.getElementById('upper-captured');
    if(upper) upper.textContent = captured.upper.map(p=>piecesMap[p]||p).join('');
    const lower = document.getElementById('lower-captured');
    if(lower) lower.textContent = captured.lower.map(p=>piecesMap[p]||p).join('');
  }

  function isUpperPiece(p){return p && p===p.toUpperCase()}
  function isEnemyPiece(src, tgt){ if(!tgt) return false; return isUpperPiece(src)!==isUpperPiece(tgt)}
  function sameSide(a,b){ if(!a||!b) return false; return isUpperPiece(a)===isUpperPiece(b)}

  function getLegalMoves(boardState, r, c){
    const p = boardState[r][c];
    if(!p) return [];
    const isUpper = isUpperPiece(p);
    const moves = [];
    const inBounds = (rr,cc)=> rr>=0 && rr<9 && cc>=0 && cc<9;

    const tryPush = (rr,cc)=>{
      if(!inBounds(rr,cc)) return false;
      const tgt = boardState[rr][cc];
      if(!tgt){ moves.push([rr,cc]); return true; }
      if(isEnemyPiece(p,tgt)){ moves.push([rr,cc]); return false; }
      return false; // same side -> blocked
    };

    const absP = p.toUpperCase();
    const forward = isUpper ? -1 : 1;

    switch(absP){
      case 'P':{
        const nr=r+forward, nc=c;
        if(inBounds(nr,nc) && !sameSide(p, boardState[nr][nc])) moves.push([nr,nc]);
        break;
      }
      case 'L':{
        let nr=r+forward, nc=c;
        while(inBounds(nr,nc)){
          if(!boardState[nr][nc]){ moves.push([nr,nc]); nr += forward; continue; }
          if(isEnemyPiece(p, boardState[nr][nc])) moves.push([nr,nc]);
          break;
        }
        break;
      }
      case 'N':{
        const nr = r + (isUpper?-2:2);
        [c-1,c+1].forEach(nc=>{ if(inBounds(nr,nc) && !sameSide(p, boardState[nr][nc])) moves.push([nr,nc]) });
        break;
      }
      case 'S':{
        const dirs = isUpper ? [[-1,0],[-1,-1],[-1,1],[1,-1],[1,1]] : [[1,0],[1,-1],[1,1],[-1,-1],[-1,1]];
        dirs.forEach(d=>{ const nr=r+d[0], nc=c+d[1]; if(inBounds(nr,nc) && !sameSide(p, boardState[nr][nc])) moves.push([nr,nc]) });
        break;
      }
      case 'G':{
        const dirs = isUpper ? [[-1,0],[-1,-1],[-1,1],[0,-1],[0,1],[1,0]] : [[1,0],[1,-1],[1,1],[0,-1],[0,1],[-1,0]];
        dirs.forEach(d=>{ const nr=r+d[0], nc=c+d[1]; if(inBounds(nr,nc) && !sameSide(p, boardState[nr][nc])) moves.push([nr,nc]) });
        break;
      }
      case 'K':{
        for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++) if(!(dr===0&&dc===0)){ const nr=r+dr,nc=c+dc; if(inBounds(nr,nc)&&!sameSide(p,boardState[nr][nc])) moves.push([nr,nc]);}
        break;
      }
      case 'B':{
        [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(d=>{
          let nr=r+d[0], nc=c+d[1];
          while(inBounds(nr,nc)){
            if(!boardState[nr][nc]){ moves.push([nr,nc]); nr+=d[0]; nc+=d[1]; continue; }
            if(isEnemyPiece(p, boardState[nr][nc])) moves.push([nr,nc]);
            break;
          }
        });
        break;
      }
      case 'R':{
        [[-1,0],[1,0],[0,-1],[0,1]].forEach(d=>{
          let nr=r+d[0], nc=c+d[1];
          while(inBounds(nr,nc)){
            if(!boardState[nr][nc]){ moves.push([nr,nc]); nr+=d[0]; nc+=d[1]; continue; }
            if(isEnemyPiece(p, boardState[nr][nc])) moves.push([nr,nc]);
            break;
          }
        });
        break;
      }
    }

    return moves;
  }

  function onCellClick(e){
    const r = Number(e.currentTarget.dataset.r);
    const c = Number(e.currentTarget.dataset.c);
    const val = board[r][c];
    const status = document.getElementById('status');
    // 選択済み
    if(selected){
      const key = coordKey(r,c);
      if(currentLegal.has(key)){
        // 合法手なら移動（キャプチャ可能）
        const movingPiece = board[selected.r][selected.c];
        const capturedPiece = board[r][c];
        if(capturedPiece){ // キャプチャ
          const normalized = capturedPiece.toUpperCase();
          if(isUpperPiece(movingPiece)){
            captured.upper.push(normalized);
          } else {
            captured.lower.push(normalized);
          }
        }
        board[r][c] = movingPiece;
        board[selected.r][selected.c] = '';
        selected = null; currentLegal.clear();
        status.textContent = capturedPiece? `駒をキャプチャしました (${r+1},${c+1})`: `駒を移動しました (${r+1},${c+1})`;
        render();
        return;
      }
      // 同じサイドの駒をクリックしたら切り替え
      if(val && sameSide(board[selected.r][selected.c], val)){
        selected = {r,c,val};
        const moves = getLegalMoves(board,r,c);
        currentLegal = new Set(moves.map(m=>coordKey(m[0],m[1])));
        status.textContent = `選択: ${piecesMap[val]||val} (${r+1},${c+1})`;
        render();
        return;
      }
      status.textContent = `その場所には移動できません (${r+1},${c+1})`;
      return;
    }
    // 未選択 -> 駒を選ぶ
    if(val){
      selected = {r,c,val};
      const moves = getLegalMoves(board,r,c);
      currentLegal = new Set(moves.map(m=>coordKey(m[0],m[1])));
      status.textContent = `選択: ${piecesMap[val]||val} (${r+1},${c+1})`;
      render();
      return;
    }
    status.textContent = `空の升をクリックしました (${r+1},${c+1})`;
  }

  // 初期配置（簡略）
  function setInitial(){
    const rows = [
      ['l','n','s','g','k','g','s','n','l'],
      ['', 'r', '', '', '', '', '', 'b', ''],
      ['p','p','p','p','p','p','p','p','p'],
      ['','','','','','','','',''],
      ['','','','','','','','',''],
      ['','','','','','','','',''],
      ['P','P','P','P','P','P','P','P','P'],
      ['', 'B', '', '', '', '', '', 'R', ''],
      ['L','N','S','G','K','G','S','N','L']
    ];
    board = rows.map(r=>r.slice());
    render();
  }

  function clearBoard(){board = Array.from({length:9},()=>Array(9).fill('')); captured = {upper:[],lower:[]}; render();}

  document.getElementById('resetBtn').addEventListener('click', ()=>{setInitial();captured = {upper:[],lower:[]}; selected=null; currentLegal.clear(); document.getElementById('status').textContent='初期配置に戻しました';render();});
  document.getElementById('clearBtn').addEventListener('click', ()=>{clearBoard();document.getElementById('status').textContent='盤をクリアしました'});
  document.getElementById('flipBtn').addEventListener('click', ()=>{flipped = !flipped; render(); document.getElementById('status').textContent = flipped? '盤を反転しました':'盤を元に戻しました';});

  // 初期化
  setInitial();
})();
