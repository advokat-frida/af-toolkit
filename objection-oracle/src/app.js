  var stage=document.getElementById('oracle');
  var views={
    welcome:document.getElementById('view-welcome'),
    questions:document.getElementById('view-questions'),
    shaking:document.getElementById('view-shaking'),
    result:document.getElementById('view-result')
  };
  var phaseByView={welcome:'welcome',questions:'questions',shaking:'shaking',result:'result'};
  var ball=document.getElementById('oracle-ball');
  var questionList=document.getElementById('question-list');
  var askButton=document.getElementById('ask-button');
  var answerCount=document.getElementById('answer-count');
  var resultTitle=document.getElementById('result-title');
  var resultReason=document.getElementById('result-reason');
  var resultAction=document.getElementById('result-action');
  var resultView=document.getElementById('view-result');
  var receipt=document.getElementById('ruling-receipt');
  var status=document.getElementById('oracle-status');
  var copyButton=document.getElementById('copy-button');
  var state={phase:'welcome',answers:[],result:null,quip:null,timer:null};

  function announce(message){status.textContent='';window.setTimeout(function(){status.textContent=message;},10);}
  function showView(name){
    Object.keys(views).forEach(function(key){views[key].classList.toggle('hidden',key!==name);});
    state.phase=name;
    stage.setAttribute('data-phase',phaseByView[name]);
  }
  function clearBall(){
    ball.classList.remove('is-shaking','show-result');
    ball.style.animationDelay='';
    ball.style.animationPlayState='';
    ball.style.animationDuration='';
    ball.removeAttribute('data-outcome');
    document.getElementById('ball-label').textContent='RULING';
    document.getElementById('ball-quip').textContent='The oracle is considering your concern.';
  }

  function answeredCount(){
    var count=0;
    for(var index=0;index<QUESTIONS.length;index+=1){if(typeof state.answers[index]==='boolean')count+=1;}
    return count;
  }
  function renderProgress(){
    var count=answeredCount();
    answerCount.textContent=count+' of '+QUESTIONS.length+' answered';
    askButton.setAttribute('aria-disabled',count===QUESTIONS.length?'false':'true');
  }
  function renderQuestionList(){
    questionList.textContent='';
    QUESTIONS.forEach(function(question,index){
      var row=document.createElement('li');
      row.className='oo-question-row';
      var prompt=document.createElement('p');
      prompt.id='question-'+question.id;
      prompt.textContent=question.prompt;
      var pair=document.createElement('span');
      pair.className='oo-pair';
      pair.setAttribute('role','group');
      pair.setAttribute('aria-labelledby',prompt.id);
      [true,false].forEach(function(value){
        var button=document.createElement('button');
        button.type='button';
        button.textContent=value?'Yes':'No';
        button.setAttribute('aria-pressed',state.answers[index]===value?'true':'false');
        button.addEventListener('click',function(){
          state.answers[index]=value;
          pair.querySelectorAll('button').forEach(function(sibling){
            sibling.setAttribute('aria-pressed',sibling===button?'true':'false');
          });
          renderProgress();
        });
        pair.appendChild(button);
      });
      row.appendChild(prompt);
      row.appendChild(pair);
      questionList.appendChild(row);
    });
    renderProgress();
  }
  function start(){
    if(state.timer)window.clearTimeout(state.timer);
    state={phase:'questions',answers:[],result:null,quip:null,timer:null};
    clearBall();
    renderQuestionList();
    showView('questions');
    questionList.querySelector('button').focus();
    announce('Five questions. Answer each yes or no.');
  }
  function renderResult(){
    var result=state.result;
    showView('result');
    resultView.setAttribute('data-outcome',result.code);
    ball.setAttribute('data-outcome',result.code);
    resultTitle.textContent=result.label;
    resultReason.textContent=result.reason;
    resultAction.textContent=result.action;
    receipt.textContent=formatReceipt(state.answers,result,state.quip);
    document.getElementById('ball-label').textContent=result.label;
    document.getElementById('ball-quip').textContent=state.quip;
    ball.classList.remove('is-shaking');
    ball.style.animationDelay='';
    ball.style.animationPlayState='';
    ball.style.animationDuration='';
    ball.classList.add('show-result');
    resultTitle.focus();
    announce('Ruling: '+result.label+'. '+state.quip);
  }
  function ask(){
    if(askButton.getAttribute('aria-disabled')==='true'){
      announce('Answer all five questions first.');
      return;
    }
    state.result=evaluateAnswers(state.answers);
    state.quip=pickQuip(state.result.code,Math.random,state.quip);
    showView('shaking');
    ball.classList.remove('show-result');
    void ball.offsetWidth;
    ball.classList.add('is-shaking');
    announce('Consulting the oracle.');
    var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    state.timer=window.setTimeout(renderResult,reduce?110:1080);
  }
  function selectReceipt(){
    var range=document.createRange();
    range.selectNodeContents(receipt);
    var selection=window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
  function copyRuling(){
    var text=receipt.textContent;
    var copied=navigator.clipboard&&navigator.clipboard.writeText
      ? navigator.clipboard.writeText(text)
      : Promise.reject(new Error('Clipboard unavailable'));
    copied.then(function(){
      copyButton.textContent='Copied';
      announce('Ruling copied.');
      window.setTimeout(function(){copyButton.textContent='Copy ruling';},1200);
    }).catch(function(){
      document.querySelector('.oo-receipt-card').open=true;
      selectReceipt();
      announce('The ruling is selected. Copy it from the full ruling box.');
    });
  }

  document.getElementById('start-button').addEventListener('click',start);
  askButton.addEventListener('click',ask);
  copyButton.addEventListener('click',copyRuling);
  document.getElementById('restart-button').addEventListener('click',start);

  window.__oracleQA={
    getState:function(){return {phase:state.phase,answers:state.answers.slice(),code:state.result&&state.result.code,quip:state.quip};},
    setAnswers:function(answers){
      if(state.phase!=='questions')start();
      state.answers=answers.slice();
      renderQuestionList();
    },
    showOutcome:function(code,quipIndex){
      if(!OUTCOMES[code])throw new Error('Unknown outcome');
      if(state.timer)window.clearTimeout(state.timer);
      state.answers=code==='HARD_STOP'?[true,true,true,false,true]:
        code==='NEXT_VERSION'?[true,true,false,false,false]:
        code==='FIX_THEN_SHIP'?[true,true,true,true,false]:
        [false,false,false,false,false];
      state.result=OUTCOMES[code];
      state.quip=RESPONSE_BANKS[code][quipIndex||0];
      renderResult();
    },
    freezeShake:function(progressValue){
      if(state.timer)window.clearTimeout(state.timer);
      state.answers=[true,true,true,false,true];
      state.result=OUTCOMES.HARD_STOP;
      state.quip=RESPONSE_BANKS.HARD_STOP[0];
      showView('shaking');
      ball.classList.remove('show-result','is-shaking');
      ball.style.animationDuration='1000ms';
      ball.style.animationDelay=(-Math.max(0,Math.min(1,progressValue))*1000)+'ms';
      ball.style.animationPlayState='paused';
      void ball.offsetWidth;
      ball.classList.add('is-shaking');
    },
    reset:start
  };
