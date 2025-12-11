// AI対戦エンジン
(()=>{
  const piecesMap = {
    P:'歩',L:'香',N:'桂',S:'銀',G:'金',K:'玉',B:'角',R:'飛',
    p:'歩',l:'香',n:'桂',s:'銀',g:'金',k:'玉',b:'角',r:'飛'
  };

  let board = [];
  let captured = {player:[], ai:[]};
  let gameHistory = [];
  let currentTurn = 'player'; // player or ai
  let selected = null;
  let currentLegal = new Set();
  let difficulty = 'easy';
  let gameOver = false;

  const grid = document.getElementById('shogi-grid');

  // 初期化
  function initBoard() {
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
    captured = {player:[], ai:[]};
    gameHistory = [];
    currentTurn = 'player';
    gameOver = false;
    selected = null;
    currentLegal.clear();
    render();
    updateStatus();
  }

  function coordKey(r,c) { return `${r},${c}`; }

  function isUpperPiece(p) { return p && p===p.toUpperCase(); }
  function sameSide(a,b) { if(!a||!b) return false; return isUpperPiece(a)===isUpperPiece(b); }
  function isEnemyPiece(src, tgt) { if(!tgt) return false; return isUpperPiece(src)!==isUpperPiece(tgt); }

  function getLegalMoves(boardState, r, c) {
    const p = boardState[r][c];
    if(!p) return [];
    const moves = [];
    const inBounds = (rr,cc)=> rr>=0 && rr<9 && cc>=0 && cc<9;

    const tryPush = (rr,cc)=>{
      if(!inBounds(rr,cc)) return false;
      const tgt = boardState[rr][cc];
      if(!tgt){ moves.push([rr,cc]); return true; }
      if(isEnemyPiece(p,tgt)){ moves.push([rr,cc]); return false; }
      return false;
    };

    const absP = p.toUpperCase();
    const isUpper = isUpperPiece(p);
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
        for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++) if(!(dr===0&&dc===0)){ const nr=r+dr,nc=c+dc; if(inBounds(nr,nc)&&!sameSide(p,boardState[nr][nc])) moves.push([nr,nc]); }
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

  function evaluateBoard(boardState, isAI) {
    let score = 0;
    const pieceValues = {P:1,L:3,N:3,S:4,G:5,K:1000,B:8,R:10};
    
    for(let r=0;r<9;r++){
      for(let c=0;c<9;c++){
        const p = boardState[r][c];
        if(!p) continue;
        const val = pieceValues[p.toUpperCase()] || 0;
        const isAIPiece = isUpperPiece(p);
        if(isAI === isAIPiece) score += val;
        else score -= val;
      }
    }
    return score;
  }

  function getAIMove(boardState) {
    let bestMove = null;
    let bestScore = -Infinity;

    for(let r=0;r<9;r++){
      for(let c=0;c<9;c++){
        const p = boardState[r][c];
        if(!p || !isUpperPiece(p)) continue;

        const moves = getLegalMoves(boardState, r, c);
        for(const [nr, nc] of moves) {
          // 試しに動かす
          const testBoard = boardState.map(row=>row.slice());
          testBoard[nr][nc] = testBoard[r][c];
          testBoard[r][c] = '';
          
          let score = evaluateBoard(testBoard, true);

          // 難易度による調整
          if(difficulty === 'easy') score += Math.random() * 100 - 50;
          else if(difficulty === 'medium') score += Math.random() * 30 - 15;
          
          if(score > bestScore) {
            bestScore = score;
            bestMove = {from:[r,c], to:[nr,nc]};
          }
        }
      }
    }
    return bestMove;
  }

  function makeMove(fromR, fromC, toR, toC, isAI) {
    const movingPiece = board[fromR][fromC];
    const capturedPiece = board[toR][toC];
    
    if(capturedPiece) {
      const normalized = capturedPiece.toUpperCase();
      if(isAI) {
        captured.ai.push(normalized);
      } else {
        captured.player.push(normalized);
      }
    }

    board[toR][toC] = movingPiece;
    board[fromR][fromC] = '';
    gameHistory.push({from:[fromR,fromC], to:[toR,toC], captured:capturedPiece});
    
    currentTurn = isAI ? 'player' : 'ai';
    selected = null;
    currentLegal.clear();
    render();
    
    // ゲーム終了チェック
    checkGameEnd();
    updateStatus();

    // AIターン
    if(currentTurn === 'ai' && !gameOver) {
      setTimeout(()=>{
        const move = getAIMove(board);
        if(move) {
          makeMove(move.from[0], move.from[1], move.to[0], move.to[1], true);
        }
      }, 800);
    }
  }

  function onCellClick(e) {
    if(gameOver || currentTurn !== 'player') return;

    const r = Number(e.currentTarget.dataset.r);
    const c = Number(e.currentTarget.dataset.c);
    const val = board[r][c];

    if(selected) {
      const key = coordKey(r,c);
      if(currentLegal.has(key)) {
        makeMove(selected.r, selected.c, r, c, false);
        return;
      }
      if(val && sameSide(board[selected.r][selected.c], val)) {
        selected = {r,c,val};
        const moves = getLegalMoves(board, r, c);
        currentLegal = new Set(moves.map(m=>coordKey(m[0],m[1])));
        render();
        return;
      }
      return;
    }

    if(val && !isUpperPiece(val)) {
      selected = {r,c,val};
      const moves = getLegalMoves(board, r, c);
      currentLegal = new Set(moves.map(m=>coordKey(m[0],m[1])));
      render();
      return;
    }
  }

  function render() {
    grid.innerHTML='';
    for(let r=0;r<9;r++){
      const tr = document.createElement('tr');
      for(let c=0;c<9;c++){
        const td = document.createElement('td');
        const val = board[r][c];
        td.dataset.r = r; td.dataset.c = c;
        td.textContent = val? (piecesMap[val] || val) : '';
        if(val) td.classList.add('piece');
        if(val && isUpperPiece(val)) td.classList.add('white');
        else if(val) td.classList.add('black');
        if(currentLegal.has(coordKey(r,c))) td.classList.add('legal');
        td.addEventListener('click', onCellClick);
        if(selected && selected.r===r && selected.c===c) td.style.outline='3px solid rgba(31,111,235,0.4)';
        tr.appendChild(td);
      }
      grid.appendChild(tr);
    }

    // 持駒表示
    document.getElementById('player-captured').textContent = captured.player.map(p=>piecesMap[p]||p).join('');
    document.getElementById('ai-captured').textContent = captured.ai.map(p=>piecesMap[p]||p).join('');
  }

  function updateStatus() {
    const turn = document.getElementById('turn-indicator');
    const status = document.getElementById('game-status');
    
    if(gameOver) {
      status.className = 'game-status game-over';
      return;
    }
    
    if(currentTurn === 'player') {
      turn.textContent = 'あなたの番です（黒）';
      status.className = '';
      status.textContent = '準備完了';
    } else {
      turn.textContent = 'AI が考え中...（白）';
      status.className = 'game-status ai-thinking';
      status.textContent = 'AI の思考中...';
    }
  }

  function findKing(boardState, isAI) {
    const king = isAI ? 'K' : 'k';
    for(let r=0;r<9;r++){
      for(let c=0;c<9;c++){
        if(boardState[r][c] === king) return [r,c];
      }
    }
    return null;
  }

  function hasLegalMoves(boardState, isAI) {
    for(let r=0;r<9;r++){
      for(let c=0;c<9;c++){
        const p = boardState[r][c];
        if(!p) continue;
        const isAIPiece = isUpperPiece(p);
        if(isAI !== isAIPiece) continue;
        const moves = getLegalMoves(boardState, r, c);
        if(moves.length > 0) return true;
      }
    }
    return false;
  }

  function checkGameEnd() {
    // プレイヤーの玉（小文字k）がない = プレイヤー敗北
    const playerKing = findKing(board, false);
    if(!playerKing) {
      gameOver = true;
      document.getElementById('game-status').className = 'game-status game-over';
      document.getElementById('game-status').textContent = '✗ AI が勝ちました！（玉を取られました）';
      document.getElementById('turn-indicator').textContent = 'ゲーム終了';
      return;
    }
    
    // AI の玉（大文字K）がない = AI敗北
    const aiKing = findKing(board, true);
    if(!aiKing) {
      gameOver = true;
      document.getElementById('game-status').className = 'game-status game-over';
      document.getElementById('game-status').textContent = '✓ あなたが勝ちました！（玉を取りました）';
      document.getElementById('turn-indicator').textContent = 'ゲーム終了';
      return;
    }
    
    // 現在のターンの側に合法手がない = 詰み
    // makeMove内でcurrentTurnは既に切り替わっているので、
    // 次のプレイヤーに合法手がなかったら、現在のプレイヤーが詰ましたことになる
    const nextIsAI = currentTurn === 'ai';
    if(!hasLegalMoves(board, nextIsAI)) {
      gameOver = true;
      const winner = nextIsAI ? 'あなた' : 'AI';
      document.getElementById('game-status').className = 'game-status game-over';
      document.getElementById('game-status').textContent = `✓ ${winner} が勝ちました！（詰み）`;
      document.getElementById('turn-indicator').textContent = 'ゲーム終了';
    }
  }

  // ボタンイベント
  ['easy','medium','hard'].forEach(d=>{
    document.getElementById(`difficulty-${d}`).addEventListener('click', ()=>{
      document.querySelectorAll('.difficulty button').forEach(b=>b.classList.remove('active'));
      event.target.classList.add('active');
      difficulty = d;
    });
  });

  document.getElementById('newGameBtn').addEventListener('click', initBoard);
  document.getElementById('undoBtn').addEventListener('click', ()=>{
    if(gameHistory.length<2) return;
    gameHistory.pop(); gameHistory.pop();
    board = [];
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
    captured = {player:[], ai:[]};
    gameHistory.forEach(move=>{
      const p = board[move.from[0]][move.from[1]];
      board[move.to[0]][move.to[1]] = p;
      board[move.from[0]][move.from[1]] = '';
      if(move.captured) {
        const normalized = move.captured.toUpperCase();
        if(isUpperPiece(move.captured)) captured.ai.push(normalized);
        else captured.player.push(normalized);
      }
    });
    currentTurn = 'player';
    render();
    updateStatus();
  });

  document.getElementById('hintsBtn').addEventListener('click', ()=>{
    if(!selected) {
      alert('駒を選択してからヒントを見てください');
      return;
    }
    const moves = getLegalMoves(board, selected.r, selected.c);
    alert(`${piecesMap[selected.val]||selected.val} は ${moves.length} 手の合法手があります`);
  });

  // 初期化
  initBoard();
})();
