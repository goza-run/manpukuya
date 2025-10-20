/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  /*await knex('user_unlocked_dialogues').del()
  await knex('dialogues').del()
  await knex('user_unlocked_characters').del()
  await knex('characters').del()
  */
  //最初だけ上やる
  // これがあるとseedrunした時に解放したものがリセットされてしまう
  
  await knex('characters').insert([
    {id: "char0", name: 'まんぷくん',imageUrl:"/characters/Manpukun.png",is_default:true},
    {id: "char1", name: 'ふっしゃん',imageUrl:"/characters/Fusshan.png",is_default:true},
    {id: "char2", name: 'ともくん',imageUrl:"/characters/Tomokun.png",is_default:true},
     //ガチャキャラ
    {id:"char3", name: 'AYA',imageUrl:"/characters/AYA.png",is_default:false},
    {id:"char4",name:"TAKAHERO",imageUrl:"/characters/TAKAHERO.png",is_default:false},
    {id:"char5",name:"ひかるん",imageUrl:"/characters/Hikarun.png",is_default:false},
    {id:"char6",name:"カープ坊やたち",imageUrl:"/characters/CarpBoys.png",is_default:false},
    {id:"char7",name:"Orix坊や",imageUrl:"/characters/Orixboy.png",is_default:false},
  ]).onConflict("id").ignore();//重複禁止にすることで上のコメントアウトコードの役割を担っている

  await knex("dialogues").insert([
    {id:1,characterId:null,text:"目標達成まで頑張ろう！！",voiceUrl:"/voices/AYA_voice_1.mp3"},
    {id:2,characterId:null,text:"PFCバランスを意識して食べようね",voiceUrl:"/voices/AYA_voice_2.mp3"},
    {id:3,characterId:null,text:"外食ばっかりになってないかな？",voiceUrl:"/voices/AYA_voice_3.mp3"},
    {id:4,characterId:null,text:"君に会えない日があると寂しいなぁ",voiceUrl:"/voices/AYA_voice_4.mp3"},

    //ふっしゃん
    {id:20,characterId:"char1",text:"完食までが出席ですよ"},
    {id:21,characterId:"char1",text:"陽電子不足だなあ"},
    {id:22,characterId:"char1",text:"君をフーリエ変換したい"},

    //ともくん
    {id:30,characterId:"char2",text:"太陽光スペクトルに想いを馳せて"},
    {id:31,characterId:"char2",text:"物理学で必要なものは、微分、積分、そして自分"},
    {id:32,characterId:"char2",text:"過去問はよく勉強しているようだ"},

    //AYA
    {id:40,characterId:"char3",text:"お腹いっぱい食べたそ〜",voiceUrl:"/voices/AYA_voice_5.mp3"},
    {id:41,characterId:"char3",text:"とうとうAYAにも春がきたそ〜",voiceUrl:"/voices/AYA_voice_6.mp3"},
    {id:42,characterId:"char3",text:"あんまりツンツンされると恥ずかしいそ〜❤️",voiceUrl:"/voices/AYA_voice_7.mp3"},
    {id:43,characterId:"char3",text:"う〜ん、君の食事には期待値がないね",voiceUrl:"/voices/AYA_voice_8.mp3"},

    //TAKAHERO
    {id:50,characterId:"char4",text:"I LOVE PEANUTS"},
    {id:51,characterId:"char4",text:"Cantondio🔥"},
    {id:52,characterId:"char4",text:"So I am ...TAKAHERO"},

    //ひかるん
    {id:60,characterId:"char5",text:"はい了解！！"},
    {id:61,characterId:"char5",text:"また外食？いい加減にして！！"},

    //カープ坊やたち
    {id:70,characterId:"char6",text:"ジャンボーーー！！"},
    {id:71,characterId:"char6",text:"にわかファンはくんなよ"},

    //Orix坊や
    {id:80,characterId:"char7",text:"俺優勝する前の年から応援してるで"},
    {id:81,characterId:"char7",text:"期待の若手？今年は茶野"},

  ]).onConflict("id").ignore();

  //デフォルトキャラと共通セリフ解放
  const users=await knex.select("id").from("users");
  if(users.length>0){
    //defaultがtrueのものだけ取り出す
    const defaultChars=await knex.select("id").from("characters").where("is_default",true);
    //characterIdがnullのやつだけ取り出す
    const commonDialogues=await knex.select("id").from("dialogues").whereNull("characterId")

    for(const user of users){
      for (const char of defaultChars){
        await knex("user_unlocked_characters").insert({userId:user.id,characterId:char.id}).onConflict().ignore(); 
      }
      //onConflict().ignore()は重複のエラーが起きても無視する指示、これで何回もseed runできる
      for (const dialogue of commonDialogues){
        await knex("user_unlocked_dialogues").insert({userId:user.id,dialogueId:dialogue.id}).onConflict().ignore(); 
      }
    }
  }
};
