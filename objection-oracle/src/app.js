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
  var resultOwner=document.getElementById('result-owner');
  var resultMeaning=document.getElementById('result-meaning');
  var resultCloseout=document.getElementById('result-closeout');
  var resultAnswers=document.getElementById('result-answers');
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
    ball.classList.remove('is-shaking');
    ball.style.animationDelay='';
    ball.style.animationPlayState='';
    ball.style.animationDuration='';
    ball.removeAttribute('data-outcome');
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
    resultOwner.textContent=result.owner;
    resultMeaning.textContent=result.meaning;
    resultCloseout.textContent=result.closeout;
    resultAnswers.textContent='';
    QUESTIONS.forEach(function(question,index){
      var row=document.createElement('li');
      var prompt=document.createElement('span');
      prompt.textContent=question.prompt;
      var flag=document.createElement('span');
      flag.className='oo-answer-flag';
      flag.textContent=state.answers[index]?'Yes':'No';
      row.appendChild(prompt);
      row.appendChild(flag);
      resultAnswers.appendChild(row);
    });
    receipt.textContent=formatReceipt(state.answers,result,state.quip);
    ball.classList.remove('is-shaking');
    ball.style.animationDelay='';
    ball.style.animationPlayState='';
    ball.style.animationDuration='';
    resultTitle.focus();
    announce('Ruling: '+result.label+'. '+state.quip);
  }
  function ask(){
    if(askButton.getAttribute('aria-disabled')==='true'){
      var pending=questionList.querySelector('.oo-pair:not(:has([aria-pressed="true"])) button');
      if(pending)pending.focus();
      announce('Answer all five questions first.');
      return;
    }
    state.result=evaluateAnswers(state.answers);
    state.quip=pickQuip(state.result.code,Math.random,state.quip);
    showView('shaking');
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
      var scratch=document.createElement('textarea');
      scratch.value=text;
      scratch.setAttribute('readonly','');
      scratch.style.position='fixed';
      scratch.style.opacity='0';
      document.body.appendChild(scratch);
      scratch.select();
      var worked=false;
      try{worked=document.execCommand('copy');}catch(error){worked=false;}
      scratch.remove();
      if(worked){copyButton.textContent='Copied';announce('Ruling copied.');window.setTimeout(function(){copyButton.textContent='Copy ruling';},1200);}
      else{selectReceipt();announce('Copying was blocked by the browser. The ruling text is selected.');}
    });
  }

  document.getElementById('start-button').addEventListener('click',start);
  askButton.addEventListener('click',ask);
  copyButton.addEventListener('click',copyRuling);
  document.getElementById('restart-button').addEventListener('click',start);
  function resetToWelcome(){
    if(state.timer)window.clearTimeout(state.timer);
    state={phase:'welcome',answers:[],result:null,quip:null,timer:null};
    clearBall();
    showView('welcome');
    document.getElementById('start-button').focus();
  }
  // The Toolkit shell posts a reset when its rail item for this tool is chosen again.
  window.addEventListener('message',function(event){
    if(event.origin!==window.location.origin)return;
    if(event.data&&event.data.toolkit==='reset')resetToWelcome();
  });

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
      ball.classList.remove('is-shaking');
      ball.style.animationDuration='1000ms';
      ball.style.animationDelay=(-Math.max(0,Math.min(1,progressValue))*1000)+'ms';
      ball.style.animationPlayState='paused';
      void ball.offsetWidth;
      ball.classList.add('is-shaking');
    },
    reset:start
  };
