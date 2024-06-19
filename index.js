const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
const doteenv = require("dotenv");
const BotUsers = require("./model/users.js");
const Task = require("./model/taskModel");

doteenv.config();
const app = express();

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI;
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("Error connecting to MongoDB:", err));

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    startContact(msg)
});
bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Botdan foydalanish uchun quyidagi buyruqlardan foydalanishingiz mumkin:

/start - Botni ishga tushirish
/setlang - Tilni oʻzgartirish 
/help - Botdan foydalanish bo'yicha yordam olish

Agar sizda savol yoki takliflar bo'lsa, iltimos, bizga murojaat qiling. Biz sizning xizmatlarimizdan to'liq foydalanishingiz uchun hamma narsani qilamiz. Rahmat!"`)
});

function setLang(msg) {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Choose your language:', {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '🇺🇿 Uzbek', callback_data: 'uz' },
                    { text: '🇺🇸 English', callback_data: 'en' },
                    { text: '🇷🇺 Русский', callback_data: 'ru' }
                ]
            ]
        }
    });
}


// Tilni o'rnatish funksiyasi
bot.onText(/\/setlang/, (msg) => {
    setLang(msg)
});
bot.on('callback_query', async(callbackQuery) => {
    const message = callbackQuery.message;
    const chatId = message.chat.id;
    switch (callbackQuery.data) {
        case 'uz':
            await backCheck(message);
            break;
        case 'en':    
         await backCheck2(message)
          break;
        case 'ru':
        await backCheck3(message)
            break;
    }
  });

      //Uzb
    async function startContact(msg) {
        const chatId = msg.chat.id;
        const opts = {
          reply_markup: JSON.stringify({
            keyboard: [
              [
                {
                  text: "Mening kontaktimni baham ko'ring",
                  request_contact: true,
                },
              ],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
            remove_keyboard: true,
          }),
        };
        bot.sendMessage(
          chatId,
          "Assalomu alaykum! Telefon raqamingizni yuboring:",
          opts
        );
    }
    
    bot.on("contact", async (msg) => {
      const chatId = msg.chat.id;
      const name = msg.chat.first_name;
      const phoneNumber = msg.contact.phone_number;
    
      try {
     // BotUserslarni topish
          let user = await BotUsers.findOne({chatId}).lean();
          // Agar foydalanuvchi topilgan bo'lsa, uning ma'lumotlarini yangilash
          if (user) {
            await BotUsers.findByIdAndUpdate(
              user._id,
              { name, phoneNumber, isActive: true, chatId }, // chatId ni ham yangilaymiz
              { new: true }
            );
          } else {
            // Agar foydalanuvchi topilmagan bo'lsa, yangi foydalanuvchi qo'shish
            const newBotUsers = new BotUsers({
              name: msg.from.first_name,
              chatId, // chatId ni qo'shamiz
              phoneNumber,
              admin: false,
              status: true,
              isActive: true,
              createdAt: new Date(),
              // action: 'request_contact'
            });
            await newBotUsers.save();
          }
          bot.sendMessage(chatId, "Telefon raqamingiz muvaffaqiyatli saqlandi!", {
            remove_keyboard: true,
          });

    setLang(msg) 
        // Admin va obi-havo foydalanuvchilari uchun alohida funktsiyalarni chaqirish
    //     if (phoneNumber === "+998330033953") {
    //       await BotUsers.findOneAndUpdate(
    //         { phoneNumber },
    //         { admin: true },
    //         { new: true }
    //       );
    //       adminStartFunc(msg);
    //     } else {
    //       startFunc(msg);
    //     }
      } catch (error) {
        console.log("error:", error);
      }
    });
  
    function startFunc(msg) {
      const chatId = msg.chat.id;
      const name = msg.chat.first_name;
      bot.sendMessage(
        chatId,
        `Xush kelibsiz! ${name} Sizning so'rovlariz va takliflaringizni qabul qilamiz. Iltimos, quyidagi  bo'limlardan birini tanlang yoki xabar jo'nating, biz tez orada sizga javob beramiz. \n bo'limni tanlang `,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Biz haqimizda", callback_data: "about" }],
              [{ text: "Xizmatlar", callback_data: "service" }],
              [{ text: "Murojaat menyusi", callback_data: "menu" }],
              [{ text: "Aloqa", callback_data: "contact" }],
            ],
          },
        }
      );
    }
  
    function adminStartFunc(msg) {
      const chatId = msg.chat.id;
      const name = msg.chat.first_name;
      bot.sendMessage(
        chatId,
        `Xush kelibsiz!  ${name} Sizning so'rovlariz va takliflaringizni qabul qilamiz. Iltimos, quyidagi bo'limlardan birini tanlang yoki xabar jo'nating, biz tez orada sizga javob beramiz.  \n bo'limni tanlang  admin`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Biz haqimizda", callback_data: "about" }],
              [{ text: "Xizmatlar", callback_data: "service" }],
              [{ text: "Murojaat menyusi", callback_data: "menu" }],
              [
                { text: "Aloqa", callback_data: "contact" },
                { text: "Admin Menu", callback_data: "adminMenu" },
              ],
            ],
          },
        }
      );
    }
    
    bot.on("callback_query", async (callbackQuery) => {
      const action = callbackQuery.data;
      const msg = callbackQuery.message;
      const chatId = msg.chat.id;
    
      switch (action) {
        case "menu":
          menuFunc(msg);
          break;
        case "about":
          aboutFun(msg);
          break;
        case "service":
          serviceFun(msg);
          break;
        case "contact":
          contactFun(msg);
          break;
        case "phone":
          phoneNumber(msg);
          break;
        case "addTask":
          addTask(msg);
          break;
        case "listTasks":
          listTasks(msg);
          break;
        case "adminMenu":
          adminMenu(msg);
          break;
        case "adminAllLists":
          adminListTasks(msg);
          break;
        case "usersList":
          userLists(msg);
          break;
        case "userCount":
          userCount(msg);
          break;
        case "userSendMessage":
          userSendMessage(msg);
          break;
        case "deleteTask":
          deleteTask(msg);
          break;
        case `deleteAdmin`:
          adminDelete(msg);
          break;
        case "editTask":
          editTask(msg);
          break;
        case "backToStart":
          backCheck(msg);
          break;
        case "editCancel":
          editCancel(msg);
          break;
        case 'backServiceMenu':
            serviceFun(msg)
            break;
        case "allService":
          allSericeFun(msg);
          break;
        case "mobilService":
          mobilService(msg);
          break;
        case "webService":
          webService(msg);
          break;
        case "cyberSecurity":
          cyberSecurity(msg);
          break;
          case "techInfo":
            techInfo(msg);
            break;
        case "biznesAvto":
          biznesAvto(msg);
          break;
        case "cloudSync":
            cloudSync(msg);
          break;
        case "startUp":
            startUp(msg);
          break;
        case "specialBots":
            specialBots(msg);
          break;
      }
    });
   
    //uz
    async function backCheck(msg) {
      const chatId = msg.chat.id;
      const messageId = msg.message_id;
      try {
        await bot.deleteMessage(chatId, messageId);
    
        if (chatId == "5803698389") {
          adminStartFunc(msg);
        } else {
          startFunc(msg);
        }
      } catch (error) {
        console.log(error);
      }
    }
    
    
    
    function phoneNumber(msg) {
      const chatId = msg.chat.id;
      bot.sendMessage(chatId, "+998330033953");
    }
    
    function aboutFun(msg) {
      const chatId = msg.chat.id;
      const messageId = msg.message_id;
      bot.deleteMessage(chatId, messageId);
      bot.sendMessage(
        chatId,
        `"DELTASOFT CYBERNETIC - bu innovatsiyalar va texnologiyalar dunyosida sizning yetakchi sherigingiz. Biz software dasturlarini ishlab chiqish, loyihalash va ta'minot xizmatlari sohasida mutaxassislik qilamiz. Bizning jamoa, o'z sohasida malakali mutaxassislar to'plamidan iborat, har bir mijoz uchun individual yechimlar ishlab chiqishga intilamiz. 
    
Bizning vazifamiz - har bir mijozning biznes jarayonlarini avtomatlashtirish, samarali va osonlashtirish. Bizning yechimlarimiz sizning biznesingizni rivojlantirishga, yangi bozorlarga kirishga va mijozlar bilan aloqani yaxshilashga yordam beradi. 
    
Biz har doim eng so'nggi texnologiyalarni va standartlarni qo'llaymiz, shuning uchun siz bizning mahsulotlarimiz va xizmatlarimizning sifatiga ishonishingiz mumkin. Bizning asosiy maqsadimiz - mijozlarimizning biznesiga qiymat qo'shish va ularning muvaffaqiyatlariga hissa qo'shish.
    
Biz bilan bog'laning va bizning jamoamiz sizning biznesingiz uchun eng yaxshi yechimni topishga yordam beradi."`,
        {
          reply_markup: {
            inline_keyboard: [
                [{ text: "Asosiy menyuga qaytish ↩️", callback_data: "backToStart" }],
            ],
          }, parse_mode: "HTML",
        }
      );
    }
    function serviceFun(msg) {
      const chatId = msg.chat.id;
      const messageId = msg.message_id;
      bot.deleteMessage(chatId, messageId);
      bot.sendMessage(chatId, `Xizmat haqida ma'lumot uchun bo'imni tanlang`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Barcha xizmatlar haqida", callback_data: "allService" }],
            [{text: "Mobil ilovalarni ishlab chiqarish", callback_data: "mobilService",} ],
            [{text: "Web dasturlarini ishlab chiqarish", callback_data: "webService",}],
            [{ text: "Kiberxavfsizlik", callback_data: "cyberSecurity" }],
            [{text: "Biznes protsesslarini avtomatlashtirish",callback_data: "biznesAvto",}],
            [{ text: "Texnologiya maslahatlari", callback_data: "techInfo" }],
            [{ text: "Cloud sinxronlash va cloud hisoblash", callback_data: "cloudSync" }],
            [{ text: "Startuplarni ishlab chiqish", callback_data: "startUp" }],
            [{ text: "Maxssus botlar ishlab chiqish", callback_data: "specialBots" }],
            [{ text: "Asosiy menyuga qaytish ↩️", callback_data: "backToStart" }],
          ],
        },
      });
    }
    function allSericeFun(msg) {
      const chatId = msg.chat.id;
      const messageId = msg.message_id;
      bot.deleteMessage(chatId, messageId);
      bot.sendMessage(
        chatId,
        `1. <b>Dasturlash va ishlab chiqarish:</b> Mobil, veb va dasturiy ta'minot ishlab chiqarish, shuningdek, tizimlar integratsiyasi va boshqalar.

2. <b>Ma'lumotlar bazasi boshqarish:</b> Ma'lumotlar bazasini loyiha talablariga moslashtirish, optimallashtirish va boshqarish.

3. <b>Cloud xizmatlari:</b> Amazon Web Services, Google Cloud, Microsoft Azure kabi bulutli xizmatlar yordamida infrastrukturani boshqarish va optimallashtirish.

4. <b>Xavfsizlik:</b> Tarmoq xavfsizligi, ma'lumotlar xavfsizligi, IT audit, xavfsizlik tekshiruvi va boshqalar.

5. <b>IT konsalting:</b> IT strategiyasi, texnologiyalar tanlash, IT infrastrukturani modernizatsiya va boshqalar.

6. <b>Qurilma va tarmoq boshqarish:</b> Serverlar, kompyuterlar, printerlar va boshqa qurilmalar uchun texnik xizmat ko'rsatish.

7. <b>Yordam markazi (Help Desk):</b> Foydalanuvchilarga texnik yordam ko'rsatish, muammolarni hal qilish va savollar javobini berish.

8. <b>IT infrastrukturasi:</b> Serverlar, tarmoqlar, saqlash tizimlari va boshqalar.

9. <b>Virtualizatsiya:</b> Serverlar, dasturiy ta'minot, ma'lumotlar bazasi va boshqalar.

10. <b>Business Intelligence va Data Analytics:</b> Ma'lumotlar analitikasi, hisobotlar tuzish va qaror qabul qilishga yordam berish.

11. <b>E-commerce xizmatlari:</b> Onlayn savdo platformalarini ishlab chiqish va boshqarish.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Xizmatlar menyusiga qaytish ↩️", callback_data: "backServiceMenu" }],
            ],
          },parse_mode: "HTML",
        }
      );
    }
    function mobilService(msg) {
      const chatId = msg.chat.id;
      const messageId = msg.message_id;
      bot.deleteMessage(chatId, messageId);
      bot.sendMessage(
        chatId,
        `<b>Mobil ilovalarni ishlab chiqarish</b> - bu biznesingizni rivojlantirishning ajoyib usuli. Biz barcha platformalar uchun ilovalarni ishlab chiqaramiz: iOS, Android va veb. 
    
    <i>iOS ilovalarni ishlab chiqarish:</i> Biz iOS platformasi uchun yuqori sifatli ilovalarni yaratamiz. Bu ilovalar iPhone, iPad va iPod Touch kabi iOS qurilmalarida ishlaydi. Biz Swift va Objective-C tillarini ishlatib, iOS uchun eng yaxshi tajribani yaratamiz.
    
    <i>Android ilovalarni ishlab chiqarish:</i> Biz Android platformasi uchun yuqori sifatli ilovalarni yaratamiz. Bu ilovalar Android telefonlarda, planshetlarda va boshqa qurilmalarda ishlaydi. Biz Java va Kotlin tillarini ishlatib, Android uchun eng yaxshi tajribani yaratamiz.
    
    Mobil ilovalarni ishlab chiqarish jarayonimiz quyidagilardan iborat:
    
    1. <b>Loyiha tahlili va rejalashtirish:</b> Biz sizning biznes talablaringizni tahlil qilamiz va loyihani rejalashtiramiz.
    
    2. <b>Dizayn:</b> Biz foydalanuvchi interfeysini va tajribasini yaratamiz.
    
    3. <b>Kod yozish:</b> Biz ilovani kodlaymiz va test qilamiz.
    
    4. <b>Testlash:</b> Biz ilovani har xil qurilmalarda va muhitlarda test qilamiz.
    
    5. <b>E'lon qilish:</b> Biz ilovani App Store yoki Google Playga joylaymiz.
    
    6. <b>Qo'llab-quvvatlash va yangilash:</b> Biz ilovani qo'llab-quvvatlaymiz va yangilaymiz.
    
    Bizning mobil ilovalarni ishlab chiqarish xizmatimiz sizning biznesingizni rivojlantirishga, mijozlar bilan aloqani yaxshilashga va yangi bozorlarga kirishga yordam beradi.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Xizmatlar menyusiga qaytish ↩️", callback_data: "backServiceMenu" }],
            ],
          }, parse_mode: "HTML",
        }
      );
    }
    function webService(msg) {
      const chatId = msg.chat.id;
      const messageId = msg.message_id;
      bot.deleteMessage(chatId, messageId);
      bot.sendMessage(
        chatId,
        `<b>Veb dasturlarni ishlab chiqarish</b> - bu biznesingizni rivojlantirishning ajoyib usuli. Biz barcha platformalar uchun veb-ilovalarni yaratamiz: front-end (foydalanuvchi interfeysi), back-end (server tomoni) va full-stack (front-end va back-end).
    
    <i>Front-end ishlab chiqarish:</i> Biz HTML, CSS va JavaScript yordamida veb-saytlarning foydalanuvchi interfeysini yaratamiz. Biz hozirgi kunda ko'p ishlatiladigan JavaScript kutubxonalarini va fremvorklarini ishlatamiz, shu jumladan React, Angular va Vue.
    
    <i>Back-end ishlab chiqarish:</i> Biz server tomonidagi kodni yozamiz, bu o'z navbatida ma'lumotlar bazasi bilan aloqa o'rnatishni, foydalanuvchi autentifikatsiyasini boshqarishni va serverdan klientga ma'lumotlarni yuborishni o'z ichiga oladi. Biz Node.js, Python, Ruby, PHP va Java kabi tillarni ishlatamiz.
    
    <i>Full-stack ishlab chiqarish:</i> Full-stack ishlab chiqaruvchilar front-end va back-end ishlarini bajarishga qodir. Ular veb-saytni to'liq yaratishga va uni ishga tushirishga qodir.
    
    Veb dasturlarni ishlab chiqarish jarayonimiz quyidagilardan iborat:
    
    1. <b>Loyiha tahlili va rejalashtirish:</b> Biz sizning biznes talablaringizni tahlil qilamiz va loyihani rejalashtiramiz.
    
    2. <b>Dizayn:</b> Biz foydalanuvchi interfeysini va tajribasini yaratamiz.
    
    3. <b>Kod yozish:</b> Biz ilovani kodlaymiz va test qilamiz.
    
    4. <b>Testlash:</b> Biz ilovani har xil brauzerlarda va muhitlarda test qilamiz.
    
    5. <b></b> Biz ilovani veb-serverga joylaymiz.
    
    6. <b>Qo'llab-quvvatlash va yangilash:</b> Biz ilovani qo'llab-quvvatlaymiz va yangilaymiz.
    
    Bizning veb dasturlarni ishlab chiqarish xizmatimiz sizning biznesingizni rivojlantirishga, mijozlar bilan aloqani yaxshilashga va yangi bozorlarga kirishga yordam beradi.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Xizmatlar menyusiga qaytish ↩️", callback_data: "backServiceMenu" }],
            ],
          }, parse_mode: "HTML",
        }
      );
    }
    function cyberSecurity(msg) {
      const chatId = msg.chat.id;
      const messageId = msg.message_id;
      bot.deleteMessage(chatId, messageId);
      bot.sendMessage(
        chatId,
        `<b>Cyber xavfsizlik</b> - bu sizning elektron ma'lumotlaringizni, tizimlaringizni va shaxsiy ma'lumotlaringizni himoya qilishning muhim tarkibi. Cyber xavfsizlik sizning biznesingizni zararsizligini ta'minlash, mijozlaringizga ishonch yaratish va biznesingizni qonuniy jazo va jarimalardan saqlashga yordam beradi.
    
    Bizning cyber xavfsizlik xizmatimiz quyidagilarni o'z ichiga oladi:
    
    1. <b>Cyber xavfsizlik baholash:</b> Biz sizning mavjud xavfsizlik tizimlaringizni baholaymiz va sizga qanday qilib xavfsizlikni yaxshilash to'g'risida maslahat beramiz.
    
    2. <b>Cyber xavfsizlik strategiyasi ishlab chiqish:</b> Biz sizning biznesingiz uchun to'g'ri cyber xavfsizlik strategiyasini ishlab chiqamiz. Bu strategiya sizning biznes maqsadlaringizga, mijozlar talablariga va bozor tendentsiyalariga mos keladi.
    
    3. <b>Cyber xavfsizlik tizimlarini implementatsiya qilish:</b> Biz sizga yangi xavfsizlik tizimlarini qanday qilib biznesingizga integratsiya qilish to'g'risida maslahat beramiz. Biz sizga xavfsizlik tizimlarini implementatsiya qilish jarayonida yuz beradigan muammolarni hal qilishga yordam beramiz.
    
    4. <b>Cyber xavfsizlik boshqarish:</b> Biz sizga xavfsizlik tizimlarini qanday qilib samarali ravishda boshqarish to'g'risida maslahat beramiz. Biz sizga xavfsizlik xarajatlaringizni kamaytirish va xavfsizlik investitsiyalarining samaradorligini oshirish to'g'risida maslahat beramiz.
    
    5. <b>Hujumlar va zararli dasturlardan himoya:</b> Biz sizning tizimlaringizni viruslardan, malware'dan, ransomware'dan va boshqa zararli dasturlardan himoya qilamiz. 
    
    6. <b>Firewall va IDS/IPS:</b> Biz sizning tarmoqingizni firewall va IDS/IPS (Intrusion Detection/Prevention Systems) yordamida himoya qilamiz.
    
    7. <b>Endianness va tarmoq xavfsizligi:</b> Biz sizning tarmoqingizni xavfsiz holatda saqlash uchun eng yaxshi amaliyotlarni ishlab chiqaramiz.
    
    8. <b>Ma'lumotlarni shifrlash:</b> Biz sizning biznes ma'lumotlaringizni xifrlab, ularni noqulay ko'zlardan himoya qilamiz.
    
    9. <b>Xavfsizlik audit va tekshiruv:</b> Biz sizning tizimlaringizni tekshirib, xavfsizlik kamchiliklarini aniqlaymiz va ularni bartaraf etish uchun tavsiyalar beramiz.
    
    10. <b>Xavfsizlik bilan bog'liq maslahatlar:</b> Biz sizga eng yaxshi xavfsizlik amaliyotlarini qo'llash, xavfsizlik siyosatini ishlab chiqish va xavfsizlik o'qitish uchun maslahat beramiz.
    
    Bizning cyber xavfsizlik xizmatimiz sizning biznesingizni zararsizligini ta'minlashga, mijozlaringizga ishonch yaratishga va biznesingizni qonuniy jazo va jarimalardan saqlashga yordam beradi.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Xizmatlar menyusiga qaytish ↩️", callback_data: "backServiceMenu" }],
            ],
          },
          parse_mode: "HTML",
        }
      );
    }
    function techInfo(msg) {
      const chatId = msg.chat.id;
      const messageId = msg.message_id;
      bot.deleteMessage(chatId, messageId);
      bot.sendMessage(
        chatId,
        `<b>Texnologiya maslahatlari</b> - bu biznesingizni rivojlantirish uchun muhim bir xizmat. Biz sizga texnologiyani qanday qilib biznesingizga integratsiya qilish, texnologiyalarni qanday qilib samarali ravishda ishlatish va texnologiya investitsiyalarini qanday qilib samarali ravishda boshqarish to'g'risida maslahat beramiz.
    
    Bizning texnologiya maslahatlari xizmatimiz quyidagilarni o'z ichiga oladi:
    
    1. <b>Texnologiya strategiyasi:</b> Biz sizning biznesingiz uchun to'g'ri texnologiya strategiyasini ishlab chiqamiz. Bu strategiya sizning biznes maqsadlaringizga, mijozlar talablariga va bozor tendentsiyalariga mos keladi.
    
    2. <b>Texnologiya audit va baholash:</b> Biz sizning mavjud texnologiyalaringizni audit qilamiz va ularning samaradorligini baholaymiz. Biz sizga qanday qilib texnologiyalarni yaxshilash va yangi texnologiyalarni qo'llash to'g'risida maslahat beramiz.
    
    3. <b>Texnologiya implementatsiyasi:</b> Biz sizga yangi texnologiyalarni qanday qilib biznesingizga integratsiya qilish to'g'risida maslahat beramiz. Biz sizga texnologiya implementatsiyasi jarayonida yuz beradigan muammolarni hal qilishga yordam beramiz.
    
    4. <b>Texnologiya boshqarish:</b> Biz sizga texnologiya investitsiyalarini qanday qilib samarali ravishda boshqarish to'g'risida maslahat beramiz. Biz sizga texnologiya xarajatlaringizni kamaytirish va texnologiya investitsiyalarining samaradorligini oshirish to'g'risida maslahat beramiz.
    
    Bizning texnologiya maslahatlari xizmatimiz sizning biznesingizni rivojlantirishga, texnologiyalarni samarali ravishda ishlatishga va texnologiya investitsiyalarini samarali ravishda boshqarishga yordam beradi.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Xizmatlar menyusiga qaytish ↩️", callback_data: "backServiceMenu" }],
            ],
          }, parse_mode: "HTML",
        }
      );
    }
    function biznesAvto(msg) {
      const chatId = msg.chat.id;
      const messageId = msg.message_id;
      bot.deleteMessage(chatId, messageId);
      bot.sendMessage(
        chatId,
        `<b>Biznes protsesslarini avtomatlashtirish</b> - bu biznesingizni samarali va samarador qilishning ajoyib usuli. Biz sizga biznes protsesslarini qanday qilib avtomatlashtirish, avtomatlashtirilgan protsesslarni qanday qilib boshqarish va avtomatlashtirish investitsiyalarini qanday qilib samarali ravishda boshqarish to'g'risida maslahat beramiz.
    
    Bizning biznes protsesslarini(jarayonini) avtomatlashtirish xizmatimiz quyidagilarni o'z ichiga oladi:
    
    1. <b>Protsesslarni tahlil qilish va optimallashtirish:</b> Biz sizning mavjud biznes protsesslaringizni tahlil qilamiz va ularni qanday qilib optimallashtirish to'g'risida maslahat beramiz. Biz sizga protsesslarni tezlashtirish, xatoliklarni kamaytirish va samaradorlikni oshirish to'g'risida maslahat beramiz.
    
    2. <b>Avtomatlashtirish strategiyasi ishlab chiqish:</b> Biz sizning biznesingiz uchun to'g'ri avtomatlashtirish strategiyasini ishlab chiqamiz. Bu strategiya sizning biznes maqsadlaringizga, mijozlar talablariga va bozor tendentsiyalariga mos keladi.
    
    3. <b>Avtomatlashtirish vositalarini tanlash:</b> Biz sizga to'g'ri avtomatlashtirish vositalarini tanlash to'g'risida maslahat beramiz. Biz sizga qanday qilib vositalarni biznesingizga integratsiya qilish to'g'risida maslahat beramiz.
    
    4. <b>Avtomatlashtirilgan protsesslarni boshqarish:</b> Biz sizga avtomatlashtirilgan protsesslarni qanday qilib boshqarish to'g'risida maslahat beramiz. Biz sizga avtomatlashtirilgan protsesslarni nazorat qilish, protsesslarni yangilash va protsesslarni takomillashtirish to'g'risida maslahat beramiz.
    
    Bizning biznes protsesslarini avtomatlashtirish xizmatimiz sizning biznesingizni samarali va samarador qilishga, protsesslarni tezlashtirishga va xatoliklarni kamaytirishga yordam beradi.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Xizmatlar menyusiga qaytish ↩️", callback_data: "backServiceMenu" }],
            ],
          }, parse_mode: "HTML",
        }
      );
    }
    function cloudSync(msg) {
      const chatId = msg.chat.id;
      const messageId = msg.message_id;
      bot.deleteMessage(chatId, messageId);
      bot.sendMessage(
        chatId,
        `<b>Cloud sinxronlash va cloud hisoblash</b>(bulutli hisoblash) - bu biznesingizni samarali, moslashuvchan va o'sishga tayyor qilishning ajoyib usullari. Ular sizning ma'lumotlaringizni saqlash, ulashish va ishlash uchun kuchli, moslashuvchan va samarali yechimlar beradi.
    
    Bizning cloud sinxronlash va cloud hisoblash xizmatimiz quyidagilarni o'z ichiga oladi:
    
    1. <b>Cloud sinxronlash:</b> Biz sizga ma'lumotlaringizni turli qurilmalar orasida sinxronlashtirish uchun yechimlar taklif qilamiz. Bu sizning jamoangizga bir-biriga moslashgan, samarali va samarador ishlash imkoniyatini beradi.
    
    2. <b>Cloud hisoblash:</b> Biz sizga hisoblash kuchini, saqlash imkoniyatini va ma'lumotlarni tez ishlash imkoniyatini oshirish uchun cloud hisoblash yechimlarini taklif qilamiz. Bu sizning biznesingizni o'sishga, yangi loyihalarni boshlashga va mijozlarga yaxshi xizmat ko'rsatishga tayyor qiladi.
    
    3. <b>Cloud xavfsizlik:</b> Biz sizga ma'lumotlaringizni himoya qilish, cyber hujumlardan himoyalanish va qonuniy talablarga rioya qilish uchun cloud xavfsizlik yechimlarini taklif qilamiz.
    
    4. <b>Cloud integratsiya:</b> Biz sizga turli tizimlarni va ilovalarni cloud yechimlarga integratsiya qilish uchun yordam beramiz. Bu sizning biznes protsesslaringizni avtomatlashtirish, samarali ravishda ma'lumotlarni ulashish va biznesingizni rivojlantirishga yordam beradi.
    
    Bizning cloud sinxronlash va cloud hisoblash xizmatimiz sizning biznesingizni samarali, moslashuvchan va o'sishga tayyor qilishga yordam beradi.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Xizmatlar menyusiga qaytish ↩️", callback_data: "backServiceMenu" }],
            ],
          }, parse_mode: "HTML",
        }
      );
    }
    function startUp(msg) {
      const chatId = msg.chat.id;
      const messageId = msg.message_id;
      bot.deleteMessage(chatId, messageId);
      bot.sendMessage(
        chatId,
        `Startuplarni ishlab chiqish bo'yicha xizmatlar o'z ichiga quyidagilarni oladi:
    
    1. <b>Idea validatsiyasi:</b> Biz sizning startupingiz uchun g'oyani tekshirib chiqamiz, bu sizning biznes modelingizning samarali ekanligini va sizning target bozoringizga mos kelishini ta'minlaydi.
    
    2. <b>Biznes modeli yaratish:</b> Biz sizga biznes modeli yaratishda yordam beramiz, bu sizga sizning startupingizning qanday daromad topishi kerakligini ko'rsatadi.
    
    3. <b>Mahsulot ishlab chiqish:</b> Biz sizga prototip yaratishdan boshlab, to'liq funktsional mahsulotga o'tishgacha bo'lgan barcha jarayonlarda yordam beramiz.
    
    4. <b>Marketing va sotish strategiyasi:</b> Biz sizga sizning mahsulotingizni qanday targ'ib qilish va sotish kerakligi to'g'risida maslahat beramiz.
    
    5. <b>Moliyaviy model va boshlang'ich moliyaviy tahlil:</b> Biz sizga startupingizning moliyaviy tahlilini va proyeksiyalarni yaratishda yordam beramiz.
    
    6. <b>Investitsiya talab qilish:</b> Biz sizga startupingiz uchun moliyaviy mablag' talab qilish jarayonida yordam beramiz, shu jumladan, investitsiya taklifnomalarini tayyorlash, investitsiyalar uchun prezentatsiyalar tuzish va investitsiya muzokaralarini o'tkazish.
    
    Bizning maqsadimiz sizning startupingizni muvaffaqiyatga erish uchun zarur bo'lgan barcha resurslarni va bilimlarni ta'minlash. Biz sizning g'oyangizni amalga oshirishga va sizning startupingizni keyingi darajaga olib chiqishga yordam beramiz.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Xizmatlar menyusiga qaytish ↩️", callback_data: "backServiceMenu" }],
            ],
          }, parse_mode: "HTML",
        }
      );
    }
    function specialBots(msg) {
      const chatId = msg.chat.id;
      const messageId = msg.message_id;
      bot.deleteMessage(chatId, messageId);
      bot.sendMessage(
        chatId,
        `Maxsus botlar ishlab chiqish xizmati, sizning biznesingizni rivojlantirish va samaradorligini oshirish uchun juda muhimdir. Biz sizga quyidagi botlarni yaratishda yordam beramiz:
    
    1. <i>Telegram botlari:</i> Telegram botlari sizning biznesingiz uchun ajoyib vosita bo'lishi mumkin. Ular sizning mijozlar bilan muloqot qilish, savollarga javob berish, buyurtmalarni qabul qilish va hokazo kabi vazifalarni bajarishga yordam beradi. Biz sizga botni sizning talablaringizga moslashuvchan holda yaratishda yordam beramiz.
    
    2. <i>Trading botlari:</i> Trading botlari sizning savdo strategiyalaringizni amalga oshirishga yordam beradi. Ular savdo signalini taqib qilish, buyurtmalarni bajarish, riskni boshqarish va hokazo kabi vazifalarni bajaradi. Biz sizga botni sizning savdo strategiyalaringizga moslashuvchan holda yaratishda yordam beramiz.
    
    3. <i>Ijtimoiy tarmoq botlari:</i> Ijtimoiy tarmoq botlari sizning biznesingizni ijtimoiy tarmoqlarda targ'ib qilishga yordam beradi. Ular sizning xabarlarangizni tarqatish, foydalanuvchilarni taqib qilish, mijozlar bilan muloqot qilish va hokazo kabi vazifalarni bajaradi. Biz sizga botni sizning ijtimoiy tarmoq strategiyalaringizga moslashuvchan holda yaratishda yordam beramiz.
    
    4. <i>Shopping botlar:</i> - bu har qanday onlayn savdo biznesi uchun juda kuchli vosita. Ular mijozlar bilan muloqot qilish, mahsulotlarni tavsiya qilish, buyurtmalarni qabul qilish va mijozlarni to'lov jarayoniga yo'naltirish uchun ishlatiladi. 
    
    Botlar ishlab chiqish xizmati o'z ichiga quyidagi elementlarni oladi:
    
    1. <b>Botlar strategiyasi yaratish:</b> Bu jarayon botning maqsadini, foydalanuvchilarning qanday murojaat qilishi kerakligini va botning qanday javob berishi kerakligini aniqlashni o'z ichiga oladi. Biz sizning biznesingiz uchun eng samarali bot strategiyasini yaratishga yordam beramiz.
    
    2. <b>Botning dizayni:</b> Botning dizayni foydalanuvchining bot bilan muloqot qilishini osonlashtiradi. Biz botning interfeysini va foydalanuvchi tajribasini yaratamiz, shu jumladan, botning menularini, tugmalarini va boshqa elementlarini.
    
    3. <b>Botning kodlashi:</b> Biz botni sizning talablaringizga moslashuvchan holda kodlaymiz. Bu jarayon Python, JavaScript, Ruby va boshqa dasturlash tillarini o'z ichiga oladi.
    
    4. <b>Botning testlashi:</b> Biz botni amaliyotda test qilamiz, bu sizning botning to'g'ri ishlashini ta'minlaydi. Biz botning barcha funktsiyalarini tekshiramiz va botning foydalanuvchilar bilan to'g'ri muloqot qilishini ta'minlaymiz.
    
    5. <b>Botning ta'minoti:</b> Biz botni sizning serveringizga o'rnatamiz va botning to'g'ri ishlashini ta'minlaymiz. Biz botni doimiy ravishda yangilab turamiz va botning ishlashini nazorat qilamiz.
    
    6. <b>Botning analitikasi:</b> Biz botning samaradorligini o'lchaymiz va botning foydalanuvchilar bilan qanday muloqot qilayotganini tahlil qilamiz. Biz sizga botning samarali ekanligini ko'rsatuvchi hisobotlar taqdim etamiz.
    
    Bizning maqsadimiz sizning biznesingiz uchun eng samarali botni yaratish. Biz sizning botingizni amalga oshirishga va sizning biznesingizni keyingi darajaga olib chiqishga yordam beramiz.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Xizmatlar menyusiga qaytish ↩️", callback_data: "backServiceMenu" }],
            ],
          }, parse_mode: "HTML",
        }
      );
    }
    
    
    function contactFun(msg) {
      const chatId = msg.chat.id;
      const messageId = msg.message_id;
      bot.deleteMessage(chatId, messageId);
      bot.sendMessage(chatId, "Aloqa ma'lumotlari", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Telefon", callback_data: "phone" }],
            [
              { text: "Sayt", url: "https://deltasoft.uz" },
              { text: "Telegram", url: "https://t.me/deltasoft_uz" },
            ],
            [
              { text: "Intagram", url: "https://instagram.com/deltasoft.uz" },
              { text: "LinkedIn", url: "https://linkedIn.com/deltasoft_uz" },
            ],
            [{ text: "Telegram Admin", url: "https://t.me/rasulov_n7" }],
            [{ text: "Asosiy menyuga qaytish ↩️", callback_data: "backToStart" }],
          ],
        },
      });
    }
    function menuFunc(msg) {
      const chatId = msg.chat.id;
      const messageId = msg.message_id;
      bot.deleteMessage(chatId, messageId);
      bot.sendMessage(chatId, "Murojaatnoma yuborish bo'limi", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Murojaat berish so'rovi", callback_data: "addTask" }],
            [{ text: "So'rovlar tarixi", callback_data: "listTasks" }],
            [
              { text: "So'rovni o'chirish", callback_data: "deleteTask" },
              { text: "So'rovni taxrirlash", callback_data: "editTask" },
            ],
            [{ text: "Asosiy menyuga qaytish ↩️", callback_data: "backToStart" }],
          ],
        },
      });
    }
    function adminMenu(msg) {
      const chatId = msg.chat.id;
      const messageId = msg.message_id;
      bot.deleteMessage(chatId, messageId);
      bot.sendMessage(chatId, "Bo'limni tanlang  admin", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Hamma so'rovlar", callback_data: "adminAllLists" }],
            [
              { text: "Foydalanuvchilar ruyxati", callback_data: "usersList" },
              { text: "Foydalanuvchilar statistikasi", callback_data: "userCount" },
            ],
            [
              {
                text: "Foydalanuvchilarga xabar yuborish",
                callback_data: "userSendMessage",
              },
            ],
            [{ text: "Asosiy menyuga qaytish ↩️", callback_data: "backToStart" }],
          ],
        },
      });
    }
    async function userLists(msg) {
      const chatId = msg.chat.id;
      const users = await BotUsers.find();
      users.forEach(async (user) => {
        const uid = "`" + `${user.chatId}` + "`";
        bot.sendMessage(
          chatId,
          `id: ${uid} \nFoydalanuvchi ismi: ${user.name} \nTelefon: ${user.phoneNumber}`,
          { parse_mode: "Markdown" }
        );
      });
    }
    async function userCount(msg) {
      try {
        const chatId = msg.chat.id;
        const users = await BotUsers.find();
        const tasks = await Task.find();
        const userLength = users.length;
        const taskLength = tasks.length;
    
        // if(userLength === 0){
        //   bot.sendMessage(chatId, `Foydalanuvchilar mavjud emas`)
        // }
        // Botni bloklangan foydalanuvchilarning sonini hisoblash
        const blockedBotUserssCount = users.filter(
          (user) => user.status === false
        ).length;
    
        // Foydalanuvchilar sonini bir marta chiqarish va bloklangan foydalanuvchilarni bildirish
        bot.sendMessage(
          chatId,
          `@Grellaparat_zakas_bot uchun statistika: \nFoydalanuvchilar: \nBarcha foydalanuvchilar: ${userLength} \nBot bloklangan: ${blockedBotUserssCount} \n \nXabarlar: \nBarcha xabarlar: ${taskLength} \n\nBotni bloklagan foydalanuvchilarning hisoblagichi translyatsiya posti yuborilganda yangilanadi.`,
          { parse_mode: "Markdown" }
        );
    
        // Tasklarni ham qaytarish mumkin
        return tasks;
      } catch (error) {
        console.log(error);
      }
    }
    
    async function userSendMessage(msg) {
      try {
        const chatId = msg.chat.id;
        const adminId = "5803698389";
        // MongoDB da status true bo'lgan foydalanuvchilarni tanlash
        const users = await BotUsers.find({ status: true });
    
        // Foydalanuvchidan xabar matnini so'rash
        await bot.sendMessage(adminId, `Xabar matnini kiriting: `, {
          parse_mode: "Markdown",
        });
        const messageResponse = await new Promise((resolve) => {
          bot.once("message", resolve);
        });
        const textMessage = messageResponse.text;
    
        // Foydalanuvchidan rasmni so'rash
        await bot.sendMessage(adminId, `Rasmni yuboring: `, {
          parse_mode: "Markdown",
        });
        const photoMessage = await new Promise((resolve) => {
          bot.once("photo", (msg) => {
            if (msg.photo) {
              resolve(msg.photo[0].file_id);
            }
          });
        });
    
        // Foydalanuvchilarga rasm va matnni yuborish
        for (const user of users) {
          try {
            await bot.sendPhoto(user.chatId, photoMessage, {
              caption: textMessage,
            });
          } catch (error) {
            // Xatolikni tekshirish va uni qaytarish
            // console.log('Xabar yuborishda xato yuz berdi:', error);
          }
        }
      } catch (error) {
        // console.log(error);
      }
    }
    
    async function addTask(msg) {
      const chatId = msg.chat.id;
      delete state[chatId];
      const currentDate = new Date("2024-05-25 12:13");
      const adtxt =
        "`" +
        `\nFullName: Murojaatchi ism familyasi \nTitle: Murojaatnoma nomi\nDescription: murojaat haqida tavfis \nPhone: +998331234567  ` +
        "`";
      bot.sendMessage(
        chatId,
        "Iltimos, murojaat so'rovi tafsilotlarini quyidagi formatda taqdim eting: " +
          adtxt,
        {
          reply_markup: {
            inline_keyboard: [[{ text: "Back", callback_data: "menu" }]],
          },
          parse_mode: "Markdown",
        }
      );
      bot.once("message", async (msg) => {
        const text = msg.text;
        const lines = text.split("\n");
        const fullNameLine = lines.find((line) => line.startsWith("FullName:"));
        const titleLine = lines.find((line) => line.startsWith("Title:"));
        const descriptionLine = lines.find((line) =>
          line.startsWith("Description:")
        );
        const phoneLine = lines.find((line) => line.startsWith("Phone:"));
    
        if (!fullNameLine || !titleLine || !descriptionLine || !phoneLine) {
          bot.sendMessage(
            chatId,
            "Iltimos, barcha murojaatnoma so'rovi tafsilotlarini to'g'ri formatda taqdim eting."
          );
          return addTask(msg);
        }
        const fullName = fullNameLine.split(": ")[1];
        const title = titleLine.split(": ")[1];
        const description = descriptionLine.split(": ")[1];
        const phone = phoneLine.split(": ")[1];
    
        // Add task to MongoDB
        const newTask = new Task({ fullName, title, description, phone, chatId });
        await newTask.save();
        bot.sendMessage(chatId, "So'rov qo'shildi!");
      });
    }
    
    // list all
    async function listTasks(msg) {
      const chatId = msg.chat.id;
      delete state[chatId];
      const tasks = await Task.find({ chatId });
      if (tasks.length === 0) {
        bot.sendMessage(chatId, "Hech qanday murojaat so'rovi topilmadi.");
      } else {
        tasks.forEach(async (task, index) => {
          // So'rov raqami tugagani tek
          const completionStatus = task.completed ? "Yes" : "No";
          bot.sendMessage(
            chatId,
            `So'rov ${index + 1}: \nFullName: ${task.fullName} \nTitle: ${
              task.title
            }\nDescription: ${task.description}\nPhone: ${
              task.phone
            }\nCompleted: ${completionStatus}`
          );
        });
      }
    }
    // list all admin
    async function adminListTasks(msg) {
      const chatId = msg.chat.id;
    
      const adminBotUsersId = await BotUsers.findOne({ chatId });
      if (!adminBotUsersId || adminBotUsersId.phoneNumber !== "+998330033953") {
        bot.sendMessage(chatId, "Sizga bunday so'rov mumkin emas!");
        return;
      }
    
      const tasks = await Task.find();
      if (tasks.length == 0) {
        bot.sendMessage(chatId, "Hech qanday murojaat so'rovi topilmadi.");
      } else {
        tasks.forEach(async (task, index) => {
          const userId = task.chatId;
          const userPhone = task.phone;
    
          const completionStatus = task.completed ? "Ha" : "Yo'q";
          bot.sendMessage(
            chatId,
            `Author ID: <a href="https://t.me/${userPhone}" >${userId}</a> \nSo'rov raqami ${
              index + 1
            }:\nTo'liq ismi: ${task.fullName}\nSarlavha: ${task.title}\nTavsif: ${
              task.description
            }\nTelefon raqam: ${task.phone}\nBajarildi: ${completionStatus}`,
            {
              reply_markup: {
                inline_keyboard: [
                  [{ text: "O'chirish", callback_data: `deleteAdmin` }],
                ],
              },
              parse_mode: "HTML",
            }
          );
        });
      }
    }
    
    // delete
    function deleteTask(msg) {
      const chatId = msg.chat.id;
      bot.sendMessage(
        chatId,
        "O'chirmoqchi bo'lgan so'rovingiz raqamini kiriting:"
      );
      // // Handle delete task
      bot.once("message", async (msg) => {
        const chatId = msg.chat.id;
        const taskIndex = parseInt(msg.text) - 1;
        // Find task by index and delete from MongoDB
        const tasks = await Task.find({ chatId });
        if (taskIndex >= 0 && tasks.length > taskIndex) {
          await Task.findByIdAndDelete(tasks[taskIndex]._id);
          bot.sendMessage(chatId, "So'rovingiz o'chirildi!");
          menuFunc(msg);
        } else {
           bot.sendMessage(
            chatId,
            "So'rov topilmadi. Iltmos tekshirib qaytadan yuboring."
          );
          return menuFunc(msg)  ;
        }
      });
    }
    // Admin delete
    async function adminDelete(msg) {
      const chatId = msg.chat.id;
      bot.sendMessage(
        chatId,
        "O'chirmoqchi bo'lgan so'rovingiz raqamini kiriting:"
      );
      bot.once("message", async (msg) => {
        const chatId = msg.chat.id;
        const taskIndex = parseInt(msg.text) - 1;
        // Find task by index and delete from MongoDB
        const tasks = await Task.find();
        if (taskIndex >= 0 && tasks.length > taskIndex) {
          await Task.findByIdAndDelete(tasks[taskIndex]._id);
          bot.sendMessage(chatId, "So'rovingiz o'chirildi!");
          backCheck(msg);
        } else {
          bot.sendMessage(
            chatId,
            "So'rov topilmadi. Iltmos tekshirib qaytadan yuboring."
          );
          return adminMenu(msg);
        }
      });
    }
    
    
    const state = {};
    // edit
    async function editCancel(msg) {
      const chatId = msg.chat.id;
      await bot.sendMessage(chatId, "Tahrirni bekor qilindingiz!");
      delete state[chatId];
      return menuFunc(msg);
    }
    async function checkExistingEditing(chatId) {
      if (state[chatId]) {
        await bot.sendMessage(
          chatId,
          "Siz allaqachon so'rov raqamini tahrir qilyapsiz. Iltimos, yangisini boshlashdan oldin joriy tahrirlash jarayonini yakunlang.",
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Bekor qilish", callback_data: `editCancel` }],
              ],
            },
            parse_mode: "HTML",
          }
        );
        delete state[chatId];
        return true;
      }
      return false;
    }
    
    async function editTask(msg) {
        const chatId = msg.chat.id;
        // Check if there's an existing editing process
        if (await checkExistingEditing(chatId)) {
            return;
        }
        // Ask
        await bot.sendMessage(
            chatId,
            "Taxrirlamoqchi bo'lgan so'rovingiz raqamini kiriting:"
        );
        // Set edittask
        state[chatId] = "edittask";
    
        // edit task
        bot.on("message", async (msg) => { // Change to bot.once to listen only once
            const chatId = msg.chat.id;
            const text = msg.text;
            if (state[chatId] === "edittask") {
                const taskIndex = parseInt(text) - 1;
                // Find task by index
                const tasks = await Task.find({ chatId });
                if (tasks.length > taskIndex && taskIndex >= 0) {
                    const taskToEdit = tasks[taskIndex];
                    const txt =
                        "`" +
                        `\nFullName: ${taskToEdit.fullName} \nTitle: ${taskToEdit.title} \nDescription: ${taskToEdit.description} \nPhone: ${taskToEdit.phone}  ` +
                        "`";
                    await bot.sendMessage(
                        chatId,
                        `So'rovni tahrirlash:  ${taskToEdit.fullName}\nIltimos, yangi so'rov raqami tafsilotlarini quyidagi formatda taqdim eting:\n` +
                        txt,
                        { parse_mode: "Markdown" }
                    );
                    state[chatId] = {
                        action: "editing",
                        taskIndex,
                        taskId: taskToEdit._id,
                    };
                } else {
                    await bot.sendMessage(
                        chatId,
                        "So'rovingiz raqami topilmadi. Iltmos tekshirib qaytadan yuboring.",
                        {
                            reply_markup: {
                                inline_keyboard: [
                                    [{ text: "Bekor qilish", callback_data: `editCancel` }],
                                ],
                            },
                            parse_mode: "HTML",
                        }
                    );
                }
            } else if (state[chatId] && state[chatId].action === "editing") {
                // Parse task details
                const lines = text.split("\n");
                const fullNameLine = lines.find((line) => line.startsWith("FullName:"));
                const titleLine = lines.find((line) => line.startsWith("Title:"));
                const descriptionLine = lines.find((line) => line.startsWith("Description:"));
                const phoneLine = lines.find((line) => line.startsWith("Phone:"));
    
                if (!fullNameLine || !titleLine || !descriptionLine || !phoneLine) {
                    await bot.sendMessage(
                        chatId,
                        "Hato format. Iltimos, so'rov tafsilotlarini to'g'ri formatda yuboring."
                    );
                    return; // Exit early if format is incorrect
                }
    
                const fullName = fullNameLine.split(": ")[1];
                const title = titleLine.split(": ")[1];
                const description = descriptionLine.split(": ")[1];
                const phone = phoneLine.split(": ")[1];
                const taskId = state[chatId].taskId;
    
                // Update task in MongoDB
                await Task.findByIdAndUpdate(taskId, {
                    fullName,
                    title,
                    description,
                    phone,
                });
                await bot.sendMessage(chatId, "So'rov o'zgartirildi!");
                delete state[chatId];
                // Clear the state
                return menuFunc(msg);
            }
        });
    }
    
    //Uzb
























     //en
     
     bot.on("callback_query", async (callbackQuery) => {
        const action = callbackQuery.data;
        const msg = callbackQuery.message;
        const chatId = msg.chat.id;
      
        switch (action) {
          case "menu2":
            menuFunc2(msg);
            break;
          case "about2":
            aboutFun2(msg);
            break;
          case "service2":
            serviceFun2(msg);
            break;
          case "contact2":
            contactFun2(msg);
            break;
          case "phone2":
            phoneNumber2(msg);
            break;
          case "addTask2":
            addTask2(msg);
            break;
          case "listTasks2":
            listTasks2(msg);
            break;
          case "adminMenu2":
            adminMenu2(msg);
            break;
          case "adminAllLists2":
            adminListTasks2(msg);
            break;
          case "usersList2":
            userLists2(msg);
            break;
          case "userCount2":
            userCount2(msg);
            break;
          case "userSendMessage2":
            userSendMessage2(msg);
            break;
          case "deleteTask2":
            deleteTask2(msg);
            break;
          case `deleteAdmin2`:
            adminDelete2(msg);
            break;
          case "editTask2":
            editTask2(msg);
            break;
          case "backToStart2":
            backCheck2(msg);
            break;
          case "editCancel2":
            editCancel2(msg);
            break;
          case 'backServiceMenu2':
              serviceFun2(msg)
              break;
          case "allService2":
            allSericeFun2(msg);
            break;
          case "mobilService2":
            mobilService2(msg);
            break;
          case "webService2":
            webService2(msg);
            break;
          case "cyberSecurity2":
            cyberSecurity2(msg);
            break;
            case "techInfo2":
              techInfo2(msg);
              break;
          case "biznesAvto2":
            biznesAvto2(msg);
            break;
          case "cloudSync2":
              cloudSync2(msg);
            break;
          case "startUp2":
              startUp2(msg);
            break;
          case "specialBots2":
              specialBots2(msg);
            break;
        }
      });
    function startFunc2(msg) {
        const chatId = msg.chat.id;
        const name = msg.chat.first_name;
        bot.sendMessage(
          chatId,
          `Welcome! ${name} We welcome your requests and suggestions. Please select one of the sections below or send a message and we will get back to you shortly. \n select section`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "About Us", callback_data: "about2" }],
                [{ text: "Services", callback_data: "service2" }],
                [{ text: "Contact menu", callback_data: "menu2" }],
                [{ text: "Communication", callback_data: "contact2" }],
              ],
            },
          }
        );
      }
    function adminStartFunc2(msg) {
        const chatId = msg.chat.id;
        const name = msg.chat.first_name;
        bot.sendMessage(
          chatId,
          `Welcome!  ${name} We welcome your requests and suggestions. Please select one of the sections below or send a message and we will get back to you shortly.  \n select section admin`,
          {
            reply_markup: {
              inline_keyboard: [
                  [{ text: "About Us", callback_data: "about2" }],
                  [{ text: "Services", callback_data: "service2" }],
                  [{ text: "Contact menu", callback_data: "menu2" }],
                [
                  { text: "Communication", callback_data: "contact2" },
                  { text: "Admin Menu", callback_data: "adminMenu2" },
                ],
              ],
            },
          }
        );
      }
    async function backCheck2(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    try {
      await bot.deleteMessage(chatId, messageId);
  
      if (chatId == "5803698389") {
        adminStartFunc2(msg);
      } else {
        startFunc2(msg);
      }
    } catch (error) {
      console.log(error);
    }
  }
  function phoneNumber2(msg) {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "+998330033953");
  }
  function aboutFun2(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(
      chatId,
      `"DELTASOFT CYBERNETIC is your leading partner in the world of innovation and technology. We specialize in the field of software development, design and support services. Our team consists of a set of experts qualified in their field, developing individual solutions for each client. we are trying to get out. 
  
Our mission is to make every customer's business processes automated, efficient and easy. Our solutions help you grow your business, enter new markets, and improve customer relationships. 
  
We always use the latest technologies and standards, so you can trust the quality of our products and services. Our main goal is to add value to our clients' businesses and contribute to their success.
  
Contact us and our team will help you find the best solution for your business."`,
      {
        reply_markup: {
          inline_keyboard: [
              [{ text: "Return to main menu ↩️", callback_data: "backToStart2" }],
          ],
        }, parse_mode: "HTML",
      }
    );
  }
  function serviceFun2(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(chatId, `Select a section for service information`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "About all services", callback_data: "allService2" }],
          [{text: "Production of mobile applications", callback_data: "mobilService2",} ],
          [{text: "Production of web programs", callback_data: "webService2",}],
          [{ text: "Cyber ​​Security", callback_data: "cyberSecurity2" }],
          [{text: "Automation of business processes",callback_data: "biznesAvto2",}],
          [{ text: "Technology tips", callback_data: "techInfo2" }],
          [{ text: "Cloud recovery and cloud", callback_data: "cloudSync2" }],
          [{ text: "Production of startups", callback_data: "startUp2" }],
          [{ text: "Development of specialized bots", callback_data: "specialBots2" }],
          [{ text: "Return to main menu ↩️", callback_data: "backToStart2" }],
        ],
      },
    });
  }
  function allSericeFun2(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(
      chatId,
      `1. <b>Development and Development:</b> Mobile, web and software development as well as systems integration and more.

2. <b>Database management:</b> Adaptation, optimization and management of the database to the project requirements.

3. <b>Cloud services:</b> Infrastructure management and optimization using cloud services such as Amazon Web Services, Google Cloud, Microsoft Azure.

4. <b>Security:</b> Network security, data security, IT audit, security audit, etc.

5. <b>IT consulting:</b> IT strategy, technology selection, IT infrastructure modernization, etc.

6. <b>Device and Network Management:</b> Maintenance for servers, computers, printers and other devices.

7. <b>Help Desk:</b> Providing technical support to users, solving problems and answering questions.

8. <b>IT infrastructure:</b> Servers, networks, storage systems, etc.

9. <b>Virtualization:</b> Servers, software, database, etc.

10. <b>Business Intelligence and Data Analytics:</b> Data analytics, reporting and decision support.

11. <b>E-commerce services:</b> Development and management of online trading platforms.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Return to services menu ↩️", callback_data: "backServiceMenu2" }],
          ],
        },parse_mode: "HTML",
      }
    );
  }
  function mobilService2(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(
      chatId,
      `<b>Mobile application development</b> is a great way to grow your business. We develop applications for all platforms: iOS, Android and web. 
  
  <i>iOS App Development:</i> We create high-quality apps for the iOS platform. These apps work on iOS devices like iPhone, iPad and iPod Touch. We use Swift and Objective-C to create the best experience for iOS.
  
  <i>Android Application Development:</i> We create high-quality applications for the Android platform. These apps work on Android phones, tablets and other devices. We use Java and Kotlin to create the best experience for Android.
  
  Our mobile app development process includes:
  
  1. <b>Project analysis and planning:</b> We analyze your business requirements and plan the project.
  
  2. <b>Design:</b> We create the user interface and experience.
  
  3. <b>Writing code:</b> We code and test the application.
  
  4. <b>Testing:</b> We test the app on different devices and environments.
  
  5. <b>Publication:</b> We place the application on the App Store or Google Play.
  
  6. <b>Support and Updates:</b> We support and update the application.
  
  Our mobile app development service can help you grow your business, improve customer relationships, and reach new markets.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Return to services menu ↩️", callback_data: "backServiceMenu" }],
          ],
        }, parse_mode: "HTML",
      }
    );
  }
  function webService2(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(
      chatId,
      `<b>Web development</b> is a great way to grow your business. We create web applications for all platforms: front-end (user interface), back-end (server side) and full-stack (front-end and back-end).
  
  <i>Front-end development:</i> We create the user interface of websites using HTML, CSS and JavaScript. We use some of the most popular JavaScript libraries and frameworks available today, including React, Angular, and Vue.
  
  <i>Back-end production:</i> We write the server-side code, which in turn includes communicating with the database, managing user authentication, and sending data from the server to the client. We use languages ​​like Node.js, Python, Ruby, PHP and Java.
  
  <i>Full-stack manufacturing:</i> Full-stack manufacturers are capable of both front-end and back-end work. They are able to build a complete website and get it up and running.
  
  Our web application development process includes:
  
  1. <b>Project analysis and planning:</b> We analyze your business requirements and plan the project.
  
  2. <b>Design:</b> We create the user interface and experience.
  
  3. <b>Writing code:</b> We code and test the application.
  
  4. <b>Testing:</b> We test the application in different browsers and environments.
  
  5. <b></b> We place the application on the web server.
  
  6. <b>Support and Updates:</b> We support and update the application.
  
  Our web development service will help you grow your business, improve customer relations and enter new markets.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Return to services menu ↩️", callback_data: "backServiceMenu2" }],
          ],
        }, parse_mode: "HTML",
      }
    );
  }
  function cyberSecurity2(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(
      chatId,
      `<b>Cyber ​​security</b> is an important component of protecting your electronic data, systems and personal information. Cyber ​​security can help keep your business safe, build trust with your customers, and protect your business from legal penalties and fines.
  
  Our cyber security service includes:
  
  1. <b>Cyber ​​Security Assessment:</b> We assess your existing security systems and advise you on how to improve your security.
  
  2. <b>Cyber ​​security strategy development:</b> We will develop the right cyber security strategy for your business. This strategy aligns with your business goals, customer requirements, and market trends.
  
  3. <b>Cyber ​​Security Systems Implementation:</b> We advise you on how to integrate new security systems into your business. We will help you solve the problems that arise during the implementation of security systems.
  
  4. <b>Cyber ​​security management:</b> We advise you on how to effectively manage your security systems. We advise you on how to reduce your security costs and improve the effectiveness of your security investments.
  
  5. <b>Protection against attacks and malware:</b> We protect your systems against viruses, malware, ransomware and other malicious software. 
  
  6. <b>Firewall and IDS/IPS:</b> We protect your network with firewall and IDS/IPS (Intrusion Detection/Prevention Systems).
  
  7. <b>Endianness and Network Security:</b> We develop best practices to keep your network secure.
  
  8. <b>Data Encryption:</b> We encrypt your business data to protect it from prying eyes.
  
  9. <b>Security audit and inspection:</b> We will audit your systems, identify security flaws and make recommendations for their elimination.
  
  10. <b>Security Advice:</b> We advise you on security best practices, security policy development and security training.
  
  Our cyber security service helps keep your business safe, build trust with your customers, and protect your business from legal penalties and fines.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Return to services menu ↩️", callback_data: "backServiceMenu2" }],
          ],
        },
        parse_mode: "HTML",
      }
    );
  }
  function techInfo2(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(
      chatId,
      `<b>Technology Consulting</b> is an important service for your business development. We advise you on how to integrate technology into your business, how to use technology effectively, and how to effectively manage your technology investments.
  
  Our technology consulting services include:
  
  1. <b>Technology Strategy:</b> We develop the right technology strategy for your business. This strategy aligns with your business goals, customer requirements, and market trends.
  
  2. <b>Technology audit and evaluation:</b> We audit your existing technologies and evaluate their effectiveness. We advise you on how to improve technologies and apply new technologies.
  
  3. <b>Technology implementation:</b> We advise you on how to integrate new technologies into your business. We will help you solve the problems that arise during the technology implementation process.
  
  4. <b>Technology Management:</b> We advise you on how to effectively manage your technology investments. We advise you on how to reduce your technology costs and improve the efficiency of your technology investments.
  
  Our technology consulting service helps you grow your business, use technology effectively, and manage your technology investments effectively.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Return to services menu ↩️", callback_data: "backServiceMenu2" }],
          ],
        }, parse_mode: "HTML",
      }
    );
  }
  function biznesAvto2(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(
      chatId,
      `<b>Automating business processes</b> is a great way to make your business efficient and effective. We advise you on how to automate business processes, how to manage automated processes and how to effectively manage your automation investment.
  
  Our business process automation service includes:
  
  1. <b>Analysis and optimization of processes:</b> We analyze your existing business processes and give advice on how to optimize them. We advise you on how to speed up processes, reduce errors and increase efficiency.
  
  2. <b>Automation Strategy Development:</b> We will develop the right automation strategy for your business. This strategy aligns with your business goals, customer requirements, and market trends.
  
  3. <b>Choosing Automation Tools:</b> We advise you on choosing the right automation tools. We advise you on how to integrate the tools into your business.
  
  4. <b>Managing Automated Processes:</b> We advise you on how to manage automated processes. We advise you on automated process control, process updating and process improvement.
  
  Our business process automation service helps to make your business efficient and effective, speed up processes and reduce errors.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Return to services menu ↩️", callback_data: "backServiceMenu2" }],
          ],
        }, parse_mode: "HTML",
      }
    );
  }
  function cloudSync2(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(
      chatId,
      `<b>Cloud synchronization and cloud computing</b> (cloud computing) are great ways to make your business efficient, flexible and ready for growth. They provide powerful, flexible and efficient solutions for storing, sharing and working with your data.
  
  Our cloud sync and cloud computing service includes:
  
  1. <b>Cloud synchronization:</b> We offer you solutions to synchronize your data between different devices. This enables your team to work in a cohesive, efficient and effective manner.
  
  2. <b>Cloud computing:</b> We offer you cloud computing solutions to increase computing power, storage capacity and data processing speed. This will make your business ready to grow, start new projects and provide better customer service.
  
  3. <b>Cloud security:</b> We offer you cloud security solutions to protect your data, protect against cyber attacks and comply with legal requirements.
  
  4. <b>Cloud integration:</b> We help you to integrate various systems and applications into cloud solutions. It helps you automate your business processes, efficiently share data and grow your business.
  
  Our cloud sync and cloud computing services help make your business efficient, flexible and ready for growth.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Return to services menu ↩️", callback_data: "backServiceMenu2" }],
          ],
        }, parse_mode: "HTML",
      }
    );
  }
  function startUp2(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(
      chatId,
      `Startup development services include:
  
  1. <b>Idea Validation:</b> We will validate the idea for your startup to ensure that your business model is effective and suitable for your target market.
  
  2. <b>Create a business model:</b> We help you create a business model that shows you how your startup should generate revenue.
  
  3. <b>Product development:</b> We help you in all processes from prototyping to a fully functional product.
  
  4. <b>Marketing and Sales Strategy:</b> We advise you on how to promote and sell your product.
  
  5. <b>Financial Model and Startup Financial Analysis:</b> We help you create financial analysis and projections of your startup.
  
  6. <b>Investment solicitation:</b> We assist you in the process of soliciting funding for your startup, including preparing investment invitations, making investment presentations and conducting investment negotiations.
  
  Our goal is to provide all the resources and knowledge you need to make your startup a success. We help you realize your idea and take your startup to the next level.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Return to services menu ↩️", callback_data: "backServiceMenu2" }],
          ],
        }, parse_mode: "HTML",
      }
    );
  }
  function specialBots2(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(
      chatId,
      `Custom bot development service is essential for your business development and efficiency. We help you create the following bots:
  
  1. <i>Telegram bots:</i> Telegram bots can be a great tool for your business. They help you with tasks such as communicating with customers, answering questions, taking orders, etc. We help you create a bot that is flexible to your requirements.
  
  2. <i>Trading Bots:</i> Trading bots help you implement your trading strategies. They perform tasks such as trading signal tracking, order execution, risk management, etc. We help you create a bot that adapts to your trading strategies.
  
  3. <i>Social Media Bots:</i> Social media bots help you promote your business on social media. They perform tasks such as distributing your messages, tracking users, interacting with customers, etc. We help you create a bot that adapts to your social media strategies.
  
  4. <i>Shopping Bots:</i> is a very powerful tool for any online shopping business. They are used to communicate with customers, recommend products, accept orders and guide customers through the checkout process. 
  
  The bot development service includes the following elements:
  
 1. <b>Creating a bot strategy:</b> This process involves defining the purpose of the bot, how users should approach it, and how the bot should respond. We help you create the most effective bot strategy for your business.
  
  2. <b>Design of the bot:</b> The design of the bot makes it easy for the user to interact with the bot. We create the bot's interface and user experience, including the bot's menus, buttons, and other elements.
  
  3. <b>Coding of the bot:</b> We code the bot flexibly to your requirements. This process involves Python, JavaScript, Ruby and other programming languages.
  
  4. <b>Bot Testing:</b> We test the bot in practice, which ensures that your bot works properly. We test all the functions of the bot and ensure that the bot communicates correctly with users.
  
  5. <b>Maintenance of the bot:</b> We install the bot on your server and ensure the bot works properly. We constantly update the bot and monitor the performance of the bot.
  
  6. <b>Bot Analytics:</b> We measure bot performance and analyze how the bot interacts with users. We provide you with reports that show the effectiveness of the bot.
  
  Our goal is to create the most effective bot for your business. We help you implement your bot and take your business to the next level.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Return to services menu ↩️", callback_data: "backServiceMenu2" }],
          ],
        }, parse_mode: "HTML",
      }
    );
  }
  
  
  function contactFun2(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(chatId, "Contact information", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Phone", callback_data: "phone2" }],
          [
            { text: "Site", url: "https://deltasoft.uz" },
            { text: "Telegram", url: "https://t.me/deltasoft_uz" },
          ],
          [
            { text: "Intagram", url: "https://instagram.com/deltasoft.uz" },
            { text: "LinkedIn", url: "https://linkedIn.com/deltasoft_uz" },
          ],
          [{ text: "Telegram Admin", url: "https://t.me/rasulov_n7" }],
          [{ text: "Return to main menu ↩️", callback_data: "backToStart2" }],
        ],
      },
    });
  }
  function menuFunc2(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(chatId, "Section for submitting an application", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Application request", callback_data: "addTask2" }],
          [{ text: "Request history", callback_data: "listTasks2" }],
          [
            { text: "Delete request", callback_data: "deleteTask2" },
            { text: "Edit request", callback_data: "editTask2" },
          ],
          [{ text: "Return to main menu ↩️", callback_data: "backToStart2" }],
        ],
      },
    });
  }
  function adminMenu2(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(chatId, "Select section admin", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "All requests", callback_data: "adminAllLists2" }],
          [
            { text: "List of users", callback_data: "usersList2" },
            { text: "BotUsers statistics", callback_data: "userCount2" },
          ],
          [
            {
              text: "Send messages to users",
              callback_data: "userSendMessage2",
            },
          ],
          [{ text: "Return to main menu ↩️", callback_data: "backToStart2" }],
        ],
      },
    });
  }
  async function userLists2(msg) {
    const chatId = msg.chat.id;
    const users = await BotUsers.find();
    users.forEach(async (user) => {
      const uid = "`" + `${user.chatId}` + "`";
      bot.sendMessage(
        chatId,
        `id: ${uid} \nBotUsersname: ${user.name} \nPhone: ${user.phoneNumber}`,
        { parse_mode: "Markdown" }
      );
    });
  }
  async function userCount2(msg) {
    try {
      const chatId = msg.chat.id;
      const users = await BotUsers.find();
      const tasks = await Task.find();
      const userLength = users.length;
      const taskLength = tasks.length;
  
      // Botni bloklangan foydalanuvchilarning sonini hisoblash
      const blockedBotUserssCount = users.filter(
        (user) => user.status === false
      ).length;
  
      // Foydalanuvchilar sonini bir marta chiqarish va bloklangan foydalanuvchilarni bildirish
      bot.sendMessage(
        chatId,
        `Stats for @Grellaparat_zakas_bot: \nBotUserss: \nAll BotUserss: ${userLength} \nThe bot is blocked: ${blockedBotUserssCount} \n \nMessages: \nAll messages: ${taskLength} \n\nThe counter of users who have blocked the bot is updated when a broadcast post is sent.`,
        { parse_mode: "Markdown" }
      );
  
      // Tasklarni ham qaytarish mumkin
      return tasks;
    } catch (error) {
      console.log(error);
    }
  }
  
  async function userSendMessage2(msg) {
    try {
      const chatId = msg.chat.id;
      const adminId = "5803698389";
      // MongoDB da status true bo'lgan foydalanuvchilarni tanlash
      const users = await BotUsers.find({ status: true });
  
      // Foydalanuvchidan xabar matnini so'rash
      await bot.sendMessage(adminId, `Enter message text: `, {
        parse_mode: "Markdown",
      });
      const messageResponse = await new Promise((resolve) => {
        bot.once("message", resolve);
      });
      const textMessage = messageResponse.text;
  
      // Foydalanuvchidan rasmni so'rash
      await bot.sendMessage(adminId, `Send a picture to: `, {
        parse_mode: "Markdown",
      });
      const photoMessage = await new Promise((resolve) => {
        bot.once("photo", (msg) => {
          if (msg.photo) {
            resolve(msg.photo[0].file_id);
          }
        });
      });
  
      // Foydalanuvchilarga rasm va matnni yuborish
      for (const user of users) {
        try {
          await bot.sendPhoto(user.chatId, photoMessage, {
            caption: textMessage,
          });
        } catch (error) {
          // Xatolikni tekshirish va uni qaytarish
          // console.log('Xabar yuborishda xato yuz berdi:', error);
        }
      }
    } catch (error) {
      // console.log(error);
    }
  }
  
  async function addTask2(msg) {
    const chatId = msg.chat.id;
    delete state2[chatId];
    const currentDate = new Date("2024-05-25 12:13");
    const adtxt =
      "`" +
      `\nFullName: Applicant name family \nTitle: Name of the application\nDescription: description of the appeal \nPhone: +998331234567  ` +
      "`";
    bot.sendMessage(
      chatId,
      "Please submit your application request details in the format below: " +
        adtxt,
      {
        reply_markup: {
          inline_keyboard: [[{ text: "Back", callback_data: "menu2" }]],
        },
        parse_mode: "Markdown",
      }
    );
    bot.once("message", async (msg) => {
      const text = msg.text;
      const lines = text.split("\n");
      const fullNameLine = lines.find((line) => line.startsWith("FullName:"));
      const titleLine = lines.find((line) => line.startsWith("Title:"));
      const descriptionLine = lines.find((line) =>
        line.startsWith("Description:")
      );
      const phoneLine = lines.find((line) => line.startsWith("Phone:"));
  
      if (!fullNameLine || !titleLine || !descriptionLine || !phoneLine) {
        bot.sendMessage(
          chatId,
          "Please provide all reference request details in the correct format."
        );
        return addTask2(msg);
      }
      const fullName = fullNameLine.split(": ")[1];
      const title = titleLine.split(": ")[1];
      const description = descriptionLine.split(": ")[1];
      const phone = phoneLine.split(": ")[1];
  
      // Add task to MongoDB
      const newTask = new Task({ fullName, title, description, phone, chatId });
      await newTask.save();
      bot.sendMessage(chatId, "Request added!");
    });
  }
  
  // list all
  async function listTasks2(msg) {
    const chatId = msg.chat.id;
    delete state2[chatId];
    const tasks = await Task.find({ chatId });
    if (tasks.length === 0) {
      bot.sendMessage(chatId, "No referrals were found.");
    } else {
      tasks.forEach(async (task, index) => {
        // So'rov raqami tugagani tek
        const completionStatus = task.completed ? "Yes" : "No";
        bot.sendMessage(
          chatId,
          `Appeal ${index + 1}: \nFullName: ${task.fullName} \nTitle: ${
            task.title
          }\nDescription: ${task.description}\nPhone: ${
            task.phone
          }\nCompleted: ${completionStatus}`
        );
      });
    }
  }
  // list all admin
  async function adminListTasks2(msg) {
    const chatId = msg.chat.id;
  
    const adminBotUsersId = await BotUsers.findOne({ chatId });
    if (!adminBotUsersId || adminBotUsersId.phoneNumber !== "+998330033953") {
      bot.sendMessage(chatId, "You cannot make such a request!");
      return;
    }
  
    const tasks = await Task.find();
    if (tasks.length == 0) {
      bot.sendMessage(chatId, "No referrals were found.");
    } else {
      tasks.forEach(async (task, index) => {
        const userId = task.chatId;
        const userPhone = task.phone;
  
        const completionStatus = task.completed ? "Ha" : "Yo'q";
        bot.sendMessage(
          chatId,
          `Author ID: <a href="https://t.me/${userPhone}" >${userId}</a> \nRequest number ${
            index + 1
          }:\nFull name: ${task.fullName}\nTitle: ${task.title}\nDescription: ${
            task.description
          }\nPhone number: ${task.phone}\nDone: ${completionStatus}`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Delete", callback_data: `deleteAdmin2` }],
              ],
            },
            parse_mode: "HTML",
          }
        );
      });
    }
  }
  
  // delete
  function deleteTask2(msg) {
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      "Enter the number of the request you want to delete:"
    );
    // // Handle delete task
    bot.once("message", async (msg) => {
      const chatId = msg.chat.id;
      const taskIndex = parseInt(msg.text) - 1;
      // Find task by index and delete from MongoDB
      const tasks = await Task.find({ chatId });
      if (taskIndex >= 0 && tasks.length > taskIndex) {
        await Task.findByIdAndDelete(tasks[taskIndex]._id);
        bot.sendMessage(chatId, "Your request has been deleted!");
        menuFunc2(msg);
      } else {
        bot.sendMessage(
          chatId,
          "Request not found. Please check and resend."
        );
        return menuFunc2(msg);
      }
    });
  }
  // Admin delete
  async function adminDelete2(msg) {
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      "Enter the number of the request you want to delete:"
    );
    bot.once("message", async (msg) => {
      const chatId = msg.chat.id;
      const taskIndex = parseInt(msg.text) - 1;
      // Find task by index and delete from MongoDB
      const tasks = await Task.find();
      if (taskIndex >= 0 && tasks.length > taskIndex) {
        await Task.findByIdAndDelete(tasks[taskIndex]._id);
        bot.sendMessage(chatId, "Your request has been deleted!");
        backCheck2(msg);
      } else {
        bot.sendMessage(
          chatId,
          "Request not found. Please check and resend."
        );
        return adminMenu2(msg);
      }
    });
  }
  
  
  const state2 = {};
  // edit
  async function editCancel2(msg) {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, "Your edit has been cancelled!");
    delete state2[chatId];
    return menuFunc2(msg);
  }
  async function checkExistingEditing2(chatId) {
    if (state2[chatId]) {
      await bot.sendMessage(
        chatId,
        "You are already editing a request number. Please complete the current editing process before starting a new one.",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Cancellation", callback_data: `editCancel2` }],
            ],
          },
          parse_mode: "HTML",
        }
      );
      delete state2[chatId];
      return true;
    }
    return false;
  }
  
  async function editTask2(msg) {
    const chatId = msg.chat.id;
    // Check if there's an existing editing process
    if (await checkExistingEditing2(chatId)) {
      return;
    }
    // Ask
    await bot.sendMessage(
      chatId,
      "Enter the number of the request you want to edit:"
    );
    // Set edittask
    state2[chatId] = "edittask";
  
    // edit task 
    bot.on("message", async (msg) => { // Change to bot.once to listen only once
        const chatId = msg.chat.id;
        const text = msg.text;
        if (state2[chatId] === "edittask") {
            const taskIndex = parseInt(text) - 1;
            // Find task by index
            const tasks = await Task.find({ chatId });
            if (tasks.length > taskIndex && taskIndex >= 0) {
                const taskToEdit = tasks[taskIndex];
                const txt =
                    "`" +
                    `\nFullName: ${taskToEdit.fullName} \nTitle: ${taskToEdit.title} \nDescription: ${taskToEdit.description} \nPhone: ${taskToEdit.phone}  ` +
                    "`";
                await bot.sendMessage(
                    chatId,
                    `Edit request:  ${taskToEdit.fullName}\nPlease provide details of new request number in below format:\n` +
                    txt,
                    { parse_mode: "Markdown" }
                );
                state2[chatId] = {
                    action: "editing",
                    taskIndex,
                    taskId: taskToEdit._id,
                };
            } else {
                await bot.sendMessage(
                    chatId,
                    "Your request number was not found. Please check and resend.",
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "Cancel", callback_data: `editCancel2` }],
                            ],
                        },
                        parse_mode: "HTML",
                    }
                );
            }
        } else if (state2[chatId] && state2[chatId].action === "editing") {
            // Parse task details
            const lines = text.split("\n");
            const fullNameLine = lines.find((line) => line.startsWith("FullName:"));
            const titleLine = lines.find((line) => line.startsWith("Title:"));
            const descriptionLine = lines.find((line) => line.startsWith("Description:"));
            const phoneLine = lines.find((line) => line.startsWith("Phone:"));

            if (!fullNameLine || !titleLine || !descriptionLine || !phoneLine) {
                await bot.sendMessage(
                    chatId,
                    "Format error. Please submit your request details in the correct format."
                );
                return; // Exit early if format is incorrect
            }

            const fullName = fullNameLine.split(": ")[1];
            const title = titleLine.split(": ")[1];
            const description = descriptionLine.split(": ")[1];
            const phone = phoneLine.split(": ")[1];
            const taskId = state2[chatId].taskId;

            // Update task in MongoDB
            await Task.findByIdAndUpdate(taskId, {
                fullName,
                title,
                description,
                phone,
            });
            await bot.sendMessage(chatId, "Request changed!");
            delete state2[chatId];
            // Clear the state
            return menuFunc2(msg);
        }
    });
  }
      //en




















     //ru
     
     bot.on("callback_query", async (callbackQuery) => {
        const action = callbackQuery.data;
        const msg = callbackQuery.message;
        const chatId = msg.chat.id;
      
        switch (action) {
          case "menu3":
            menuFunc3(msg);
            break;
          case "about3":
            aboutFun3(msg);
            break;
          case "service3":
            serviceFun3(msg);
            break;
          case "contact3":
            contactFun3(msg);
            break;
          case "phone3":
            phoneNumber3(msg);
            break;
          case "addTask3":
            addTask3(msg);
            break;
          case "listTasks3":
            listTasks3(msg);
            break;
          case "adminMenu3":
            adminMenu3(msg);
            break;
          case "adminAllLists3":
            adminListTasks3(msg);
            break;
          case "usersList3":
            userLists3(msg);
            break;
          case "userCount3":
            userCount3(msg);
            break;
          case "userSendMessage3":
            userSendMessage3(msg);
            break;
          case "deleteTask3":
            deleteTask3(msg);
            break;
          case `deleteAdmin3`:
            adminDelete3(msg);
            break;
          case "editTask3":
            editTask3(msg);
            break;
          case "backToStart3":
            backCheck3(msg);
            break;
          case "editCancel3":
            editCancel3(msg);
            break;
          case 'backServiceMenu3':
              serviceFun3(msg)
              break;
          case "allService3":
            allSericeFun3(msg);
            break;
          case "mobilService3":
            mobilService3(msg);
            break;
          case "webService3":
            webService3(msg);
            break;
          case "cyberSecurity3":
            cyberSecurity3(msg);
            break;
            case "techInfo3":
              techInfo3(msg);
              break;
          case "biznesAvto3":
            biznesAvto3(msg);
            break;
          case "cloudSync3":
              cloudSync3(msg);
            break;
          case "startUp3":
              startUp3(msg);
            break;
          case "specialBots3":
              specialBots3(msg);
            break;
        }
      });
     //ru
     function startFunc3(msg) {
        const chatId = msg.chat.id;
        const name = msg.chat.first_name;
        bot.sendMessage(
          chatId,
          `Добро пожаловать! ${name} Мы приветствуем ваши запросы и предложения. Пожалуйста, выберите один из разделов ниже или отправьте сообщение, и мы свяжемся с вами в ближайшее время. \n выбрать раздел`,
          {
            reply_markup: {
              inline_keyboard: [
                  [{ text: "О нас", callback_data: "about3" }],
                  [{ text: "Услуги", callback_data: "service3" }],
                  [{ text: "Меню контактов", callback_data: "menu3" }],
                  [{ text: "Коммуникация", callback_data: "contact3" },],
              ],
            },
          }
        );
      }
  //ru
  function adminStartFunc3(msg) {
    const chatId = msg.chat.id;
    const name = msg.chat.first_name;
    bot.sendMessage(
      chatId,
      `Добро пожаловать!  ${name} Мы приветствуем ваши запросы и предложения. Пожалуйста, выберите один из разделов ниже или отправьте сообщение, и мы свяжемся с вами в ближайшее время.  \n выберите администратора раздела`,
      {
        reply_markup: {
          inline_keyboard: [
              [{ text: "О нас", callback_data: "about3" }],
              [{ text: "Услуги", callback_data: "service3" }],
              [{ text: "Меню контактов", callback_data: "menu3" }],
            [
              { text: "Коммуникация", callback_data: "contact3" },
              { text: "Меню администратора", callback_data: "adminMenu3" },
            ],
          ],
        },
      }
    );
  }
 //ru
 async function backCheck3(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    try {
      await bot.deleteMessage(chatId, messageId);
  
      if (chatId == "5803698389") {
        adminStartFunc3(msg);
      } else {
        startFunc3(msg);
      }
    } catch (error) {
      console.log(error);
    }
  }
  function phoneNumber3(msg) {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "+998330033953");
  }
  function aboutFun3(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(
      chatId,
      `«DELTASOFT CYBERNETIC — ваш ведущий партнер в мире инноваций и технологий. Мы специализируемся в области разработки, проектирования и поддержки программного обеспечения. Наша команда состоит из набора экспертов, квалифицированных в своей области, разрабатывающих индивидуальные решения для каждого клиента. пытаются выбраться. 
  
Наша миссия — сделать бизнес-процессы каждого клиента автоматизированными, эффективными и простыми. Наши решения помогут вам развивать свой бизнес, выходить на новые рынки и улучшать отношения с клиентами. 
  
Мы всегда используем новейшие технологии и стандарты, поэтому вы можете доверять качеству нашей продукции и услуг. Наша главная цель – повысить ценность бизнеса наших клиентов и способствовать их успеху.
  
Свяжитесь с нами, и наша команда поможет вам найти лучшее решение для вашего бизнеса».`,
      {
        reply_markup: {
          inline_keyboard: [
              [{ text: "Вернуться в главное меню ↩️", callback_data: "backToStart3" }],
          ],
        }, parse_mode: "HTML",
      }
    );
  }
  function serviceFun3(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(chatId, `Выберите раздел для информации об услуге`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Обо всех услугах", callback_data: "allService3" }],
          [{text: "Производство мобильных приложений", callback_data: "mobilService3",} ],
          [{text: "Производство веб-программ", callback_data: "webService3",}],
          [{ text: "Кибербезопасность", callback_data: "cyberSecurity3" }],
          [{text: "Автоматизация бизнес-процессов",callback_data: "biznesAvto3",}],
          [{ text: "Советы по технологиям", callback_data: "techInfo3" }],
          [{ text: "Облачное восстановление и облако", callback_data: "cloudSync3" }],
          [{ text: "Производство стартапов", callback_data: "startUp3" }],
          [{ text: "Разработка специализированных ботов", callback_data: "specialBots3" }],
          [{ text: "Вернуться в главное меню ↩️", callback_data: "backToStart3" }],
        ],
      },
    });
  }
  function allSericeFun3(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(
      chatId,
      `1. <b>Разработка и развитие:</b> Разработка мобильных устройств, веб-сайтов и программного обеспечения, а также системная интеграция и многое другое.

2. <b>Управление базой данных:</b> Адаптация, оптимизация и управление базой данных под требования проекта.

3. <b>Облачные сервисы:</b> Управление и оптимизация инфраструктуры с использованием облачных сервисов, таких как Amazon Web Services, Google Cloud, Microsoft Azure.

4. <b>Безопасность:</b> Сетевая безопасность, безопасность данных, ИТ-аудит, аудит безопасности и т. д.

5. <b>ИТ-консалтинг:</b> ИТ-стратегия, выбор технологий, модернизация ИТ-инфраструктуры и т. д.

6. <b>Управление устройствами и сетью:</b> Обслуживание серверов, компьютеров, принтеров и других устройств.

7. <b>Служба поддержки:</b> Предоставление технической поддержки пользователям, решение проблем и ответы на вопросы.

8. <b>ИТ-инфраструктура:</b> Серверы, сети, системы хранения и т. д.

9. <b>Виртуализация:</b> серверы, программное обеспечение, базы данных и т. д.

10. <b>Бизнес-аналитика и анализ данных:</b> Анализ данных, отчетность и поддержка принятия решений.

11. <b>Услуги электронной коммерции:</b> Разработка и управление торговыми онлайн-платформами.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Вернуться в главное меню ↩️", callback_data: "backServiceMenu3" }],
          ],
        },parse_mode: "HTML",
      }
    );
  }
  function mobilService3(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(
      chatId,
      `<b>Разработка мобильных приложений</b> — отличный способ развития вашего бизнеса. Мы разрабатываем приложения для всех платформ: iOS, Android и веб. 
  
  <i>Разработка приложений для iOS:</i> Мы создаем высококачественные приложения для платформы iOS. Эти приложения работают на устройствах iOS, таких как iPhone, iPad и iPod Touch. Мы используем Swift и Objective-C, чтобы создать лучший опыт для iOS.
  
  <i>Разработка приложений для Android:</i> Мы создаем высококачественные приложения для платформы Android. Эти приложения работают на телефонах, планшетах и ​​других устройствах Android. Мы используем Java и Kotlin, чтобы создать лучший опыт для Android.
  
  Процесс разработки мобильного приложения включает в себя:
  
  1. <b>Анализ и планирование проекта:</b> Мы анализируем ваши бизнес-требования и планируем проект.
  
  2. <b>Дизайн.</b> Мы создаем пользовательский интерфейс и взаимодействие с ним.
  
  3. <b>Написание кода:</b> Мы пишем и тестируем приложение.
  
  4. <b>Тестирование.</b> Мы тестируем приложение на разных устройствах и в разных средах.
  
  5. <b>Публикация:</b> Размещаем приложение в App Store или Google Play.
  
  6. <b>Поддержка и обновления:</b> Мы поддерживаем и обновляем приложение.
  
  Наша служба разработки мобильных приложений поможет вам развивать свой бизнес, улучшать отношения с клиентами и выходить на новые рынки.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Вернуться в главное меню ↩️", callback_data: "backServiceMenu3" }],
          ],
        }, parse_mode: "HTML",
      }
    );
  }
  function webService3(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(
      chatId,
      `<b>Веб-разработка</b> — отличный способ развития вашего бизнеса. Мы создаем веб-приложения для всех платформ: front-end (пользовательский интерфейс), back-end (серверная часть) и full-stack (front-end и back-end).
  
  <i>Внешняя разработка:</i> Мы создаем пользовательский интерфейс веб-сайтов с использованием HTML, CSS и JavaScript. Мы используем некоторые из самых популярных библиотек и фреймворков JavaScript, доступных сегодня, включая React, Angular и Vue.
  
  <i>Вторая обработка:</i> Мы пишем серверный код, который, в свою очередь, включает в себя взаимодействие с базой данных, управление аутентификацией пользователей и отправку данных с сервера клиенту. Мы используем такие языки, как Node.js, Python, Ruby, PHP и Java.
  
  <i>Полномасштабное производство.</i> Производители полного цикла способны выполнять как интерфейсную, так и внутреннюю работу. Они могут создать полноценный веб-сайт и запустить его.
  
  Наш процесс разработки веб-приложений включает в себя:
  
  1. <b>Анализ и планирование проекта:</b> Мы анализируем ваши бизнес-требования и планируем проект.
  
  2. <b>Дизайн.</b> Мы создаем пользовательский интерфейс и взаимодействие с ним.
  
  3. <b>Написание кода:</b> Мы пишем и тестируем приложение.
  
  4. <b>Тестирование.</b> Мы тестируем приложение в разных браузерах и средах.
  
  5. <b></b> Размещаем приложение на веб-сервере.
  
  6. <b>Поддержка и обновления:</b> Мы поддерживаем и обновляем приложение.
  
  Наша услуга веб-разработки поможет вам развивать свой бизнес, улучшать отношения с клиентами и выходить на новые рынки.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Вернуться в главное меню ↩️", callback_data: "backServiceMenu3" }],
          ],
        }, parse_mode: "HTML",
      }
    );
  }
  function cyberSecurity3(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(
      chatId,
      `<b>Кибербезопасность</b> — важный компонент защиты ваших электронных данных, систем и личной информации. Кибербезопасность может помочь обеспечить безопасность вашего бизнеса, укрепить доверие клиентов и защитить ваш бизнес от юридических наказаний и штрафов.
  
  Наша служба кибербезопасности включает в себя:
  
  1. <b>Оценка кибербезопасности.</b> Мы оцениваем существующие системы безопасности и советуем вам, как улучшить вашу безопасность.
  
  2. <b>Разработка стратегии кибербезопасности:</b> Мы разработаем правильную стратегию кибербезопасности для вашего бизнеса. Эта стратегия соответствует вашим бизнес-целям, требованиям клиентов и тенденциям рынка.
  
  3. <b>Внедрение систем кибербезопасности:</b> Мы консультируем вас, как интегрировать новые системы безопасности в ваш бизнес. Мы поможем Вам решить проблемы, возникающие при внедрении систем безопасности.
  
  4. <b>Управление кибербезопасностью:</b> Мы консультируем вас, как эффективно управлять вашими системами безопасности. Мы посоветуем вам, как сократить расходы на безопасность и повысить эффективность инвестиций в безопасность.
  
  5. <b>Защита от атак и вредоносного ПО.</b> Мы защищаем ваши системы от вирусов, вредоносных программ, программ-вымогателей и другого вредоносного программного обеспечения. 
  
  6. <b>Брандмауэр и IDS/IPS:</b> Мы защищаем вашу сеть с помощью брандмауэра и IDS/IPS (систем обнаружения/предотвращения вторжений).
  
  7. <b>Порядок байтов и сетевая безопасность.</b> Мы разрабатываем лучшие методы обеспечения безопасности вашей сети.
  
  8. <b>Шифрование данных.</b> Мы шифруем ваши бизнес-данные, чтобы защитить их от посторонних глаз.
  
  9. <b>Аудит и проверка безопасности:</b> Мы проведем аудит ваших систем, выявим недостатки безопасности и дадим рекомендации по их устранению.
  
  10. <b>Советы по безопасности.</b> Мы консультируем вас по передовым методам обеспечения безопасности, разработке политики безопасности и обучению по вопросам безопасности.
  
  Наша служба кибербезопасности помогает обеспечить безопасность вашего бизнеса, укрепить доверие клиентов и защитить ваш бизнес от юридических санкций и штрафов.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Вернуться в главное меню ↩️", callback_data: "backServiceMenu3" }],
          ],
        },
        parse_mode: "HTML",
      }
    );
  }
  function techInfo3(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(
      chatId,
      `<b>Технологический консалтинг</b> — важная услуга для развития вашего бизнеса. Мы консультируем вас о том, как интегрировать технологии в ваш бизнес, как эффективно использовать технологии и как эффективно управлять инвестициями в технологии.
  
  Наши услуги по технологическому консалтингу включают в себя:
  
  1. <b>Технологическая стратегия.</b> Мы разрабатываем правильную технологическую стратегию для вашего бизнеса. Эта стратегия соответствует вашим бизнес-целям, требованиям клиентов и тенденциям рынка.
  
  2. <b>Аудит и оценка технологий.</b> Мы проверяем существующие технологии и оцениваем их эффективность. Мы консультируем вас, как совершенствовать технологии и применять новые технологии.
  
  3. <b>Внедрение технологий.</b> Мы консультируем вас, как интегрировать новые технологии в ваш бизнес. Мы поможем Вам решить проблемы, возникающие в процессе внедрения технологии.
  
  4. <b>Управление технологиями.</b> Мы консультируем вас, как эффективно управлять инвестициями в технологии. Мы посоветуем вам, как сократить затраты на технологии и повысить эффективность инвестиций в технологии.
  
  Наша служба технологического консалтинга поможет вам развивать свой бизнес, эффективно использовать технологии и эффективно управлять инвестициями в технологии.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Вернуться в главное меню ↩️", callback_data: "backServiceMenu3" }],
          ],
        }, parse_mode: "HTML",
      }
    );
  }
  function biznesAvto3(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(
      chatId,
      `<b>Автоматизация бизнес-процессов</b> — отличный способ сделать ваш бизнес эффективным и результативным. Мы консультируем вас о том, как автоматизировать бизнес-процессы, как управлять автоматизированными процессами и как эффективно управлять инвестициями в автоматизацию.
  
  Наша услуга по автоматизации бизнес-процессов включает в себя:
  
  1. <b>Анализ и оптимизация процессов:</b> Мы анализируем существующие у вас бизнес-процессы и даем советы по их оптимизации. Мы консультируем вас, как ускорить процессы, уменьшить количество ошибок и повысить эффективность.
  
  2. <b>Разработка стратегии автоматизации:</b> Мы разработаем правильную стратегию автоматизации для вашего бизнеса. Эта стратегия соответствует вашим бизнес-целям, требованиям клиентов и тенденциям рынка.
  
  3. <b>Выбор инструментов автоматизации.</b> Мы советуем вам выбрать правильные инструменты автоматизации. Мы проконсультируем вас, как интегрировать инструменты в ваш бизнес.
  
  4. <b>Управление автоматизированными процессами:</b> Мы советуем вам, как управлять автоматизированными процессами. Мы консультируем вас по вопросам автоматизированного управления процессами, их обновления и улучшения.
  
  Наша услуга по автоматизации бизнес-процессов помогает сделать ваш бизнес эффективным и результативным, ускорить процессы и снизить количество ошибок.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Вернуться в главное меню ↩️", callback_data: "backServiceMenu3" }],
          ],
        }, parse_mode: "HTML",
      }
    );
  }
  function cloudSync3(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(
      chatId,
      `<b>Облачная синхронизация и облачные вычисления</b> (облачные вычисления) — отличные способы сделать ваш бизнес эффективным, гибким и готовым к росту. Они предоставляют мощные, гибкие и эффективные решения для хранения, обмена и работы с вашими данными.
  
  Наша служба облачной синхронизации и облачных вычислений включает в себя:
  
  1. <b>Облачная синхронизация.</b> Мы предлагаем вам решения для синхронизации ваших данных между различными устройствами. Это позволяет вашей команде работать сплоченно, эффективно и результативно.
  
  2. <b>Облачные вычисления:</b> Мы предлагаем вам решения облачных вычислений для увеличения вычислительной мощности, емкости хранилища и скорости обработки данных. Это подготовит ваш бизнес к росту, запуску новых проектов и улучшению обслуживания клиентов.
  
  3. <b>Облачная безопасность.</b> Мы предлагаем вам решения облачной безопасности для защиты ваших данных, защиты от кибератак и соблюдения требований законодательства.
  
  4. <b>Интеграция с облаком.</b> Мы помогаем вам интегрировать различные системы и приложения в облачные решения. Это поможет вам автоматизировать бизнес-процессы, эффективно обмениваться данными и развивать свой бизнес.
  
  Наши услуги облачной синхронизации и облачных вычислений помогут сделать ваш бизнес эффективным, гибким и готовым к росту.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Вернуться в главное меню ↩️", callback_data: "backServiceMenu3" }],
          ],
        }, parse_mode: "HTML",
      }
    );
  }
  function startUp3(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(
      chatId,
      `Услуги по разработке стартапов включают в себя:
  
  1. <b>Проверка идеи:</b> Мы проверим идею вашего стартапа, чтобы убедиться, что ваша бизнес-модель эффективна и подходит для вашего целевого рынка.
  
  2. <b>Создайте бизнес-модель.</b> Мы помогаем вам создать бизнес-модель, которая покажет, как ваш стартап должен приносить доход.
  
  3. <b>Разработка продукта.</b> Мы помогаем вам на всех этапах: от прототипирования до полнофункционального продукта.
  
  4. <b>Стратегия маркетинга и продаж.</b> Мы консультируем вас, как продвигать и продавать ваш продукт.
  
  5. <b>Финансовая модель и финансовый анализ стартапа:</b> Мы помогаем вам провести финансовый анализ и прогнозы вашего стартапа.
  
  6. <b>Привлечение инвестиций.</b> Мы помогаем вам в процессе привлечения финансирования для вашего стартапа, включая подготовку инвестиционных приглашений, проведение инвестиционных презентаций и проведение инвестиционных переговоров.
  
  Наша цель — предоставить все ресурсы и знания, необходимые для успеха вашего стартапа. Мы поможем вам реализовать вашу идею и вывести ваш стартап на новый уровень.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Вернуться в главное меню ↩️", callback_data: "backServiceMenu3" }],
          ],
        }, parse_mode: "HTML",
      }
    );
  }
  function specialBots3(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(
      chatId,
      `Услуга разработки индивидуальных ботов необходима для развития и эффективности вашего бизнеса. Мы помогаем вам создавать следующих ботов:
  
  1. <i>Боты Telegram.</i> Боты Telegram могут стать отличным инструментом для вашего бизнеса. Они помогают вам с такими задачами, как общение с клиентами, ответы на вопросы, прием заказов и т. д. Мы помогаем вам создать бота, гибкого к вашим требованиям.
  
  2. <i>Торговые боты</i>. Торговые боты помогут вам реализовать ваши торговые стратегии. Они выполняют такие задачи, как отслеживание торговых сигналов, исполнение ордеров, управление рисками и т. д. Мы помогаем вам создать бота, который адаптируется к вашим торговым стратегиям.
  
  3. <i>Боты для социальных сетей.</i> Боты для социальных сетей помогают вам продвигать свой бизнес в социальных сетях. Они выполняют такие задачи, как распространение ваших сообщений, отслеживание пользователей, взаимодействие с клиентами и т. д. Мы помогаем вам создать бота, который адаптируется к вашим стратегиям в социальных сетях.
  
  4. <i>Торговые боты</i> — очень мощный инструмент для любого бизнеса в сфере онлайн-покупок. Они используются для общения с клиентами, рекомендации продуктов, приема заказов и руководства покупателями в процессе оформления заказа. 
  
  Услуга разработки бота включает в себя следующие элементы:
  
 1. <b>Создание стратегии бота.</b> Этот процесс включает в себя определение цели бота, того, как пользователи должны подходить к нему и как бот должен реагировать. Мы поможем вам создать наиболее эффективную стратегию использования ботов для вашего бизнеса.
  
  2. <b>Дизайн бота.</b> Дизайн бота упрощает взаимодействие пользователя с ботом. Мы создаем интерфейс и пользовательский интерфейс бота, включая меню, кнопки и другие элементы бота.
  
  3. <b>Кодирование бота:</b> Мы гибко кодируем бота под ваши требования. В этом процессе участвуют Python, JavaScript, Ruby и другие языки программирования.
  
  4. <b>Тестирование бота.</b> Мы тестируем бота на практике, что гарантирует правильную работу вашего бота. Мы тестируем все функции бота и следим за тем, чтобы бот корректно общался с пользователями.
  
  5. <b>Обслуживание бота:</b> Мы устанавливаем бота на ваш сервер и проверяем его правильную работу. Мы постоянно обновляем бота и следим за его работоспособностью.
  
  6. <b>Аналитика ботов.</b> Мы измеряем производительность бота и анализируем, как он взаимодействует с пользователями. Мы предоставляем вам отчеты, которые показывают эффективность бота.
  
  Наша цель — создать максимально эффективного бота для вашего бизнеса. Мы поможем вам внедрить вашего бота и вывести ваш бизнес на новый уровень.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Вернуться в главное меню ↩️", callback_data: "backServiceMenu3" }],
          ],
        }, parse_mode: "HTML",
      }
    );
  }
  
  
  function contactFun3(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(chatId, "Алока малумотлари", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Телефон", callback_data: "phone3" }],
          [
            { text: "Сайт", url: "https://deltasoft.uz" },
            { text: "Телеграм", url: "https://t.me/deltasoft_uz" },
          ],
          [
            { text: "Intagram", url: "https://instagram.com/deltasoft.uz" },
            { text: "LinkedIn", url: "https://linkedIn.com/deltasoft_uz" },
          ],
          [{ text: "Администратор телеграммы", url: "https://t.me/rasulov_n7" }],
          [{ text: "Вернуться в главное меню ↩️", callback_data: "backToStart3" }],
        ],
      },
    });
  }
  function menuFunc3(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(chatId, "Раздел для подачи заявки", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Запрос заявки", callback_data: "addTask3" }],
          [{ text: "История запросов", callback_data: "listTasks3" }],
          [
            { text: "Удалить запрос", callback_data: "deleteTask3" },
            { text: "Редактировать запрос", callback_data: "editTask3" },
          ],
          [{ text: "Вернуться в главное меню ↩️", callback_data: "backToStart3" }],
        ],
      },
    });
  }
  function adminMenu3(msg) {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    bot.deleteMessage(chatId, messageId);
    bot.sendMessage(chatId, "Выберите администратора раздела", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Все запросы", callback_data: "adminAllLists3" }],
          [
            { text: "Список пользователей", callback_data: "usersList3" },
            { text: "Статистика пользователей", callback_data: "userCount3" },
          ],
          [
            {
              text: "Отправлять сообщения пользователям",
              callback_data: "userSendMessage3",
            },
          ],
          [{ text: "Вернуться в главное меню ↩️", callback_data: "backToStart3" }],
        ],
      },
    });
  }
  async function userLists3(msg) {
    const chatId = msg.chat.id;
    const users = await BotUsers.find();
    users.forEach(async (user) => {
      const uid = "`" + `${user.chatId}` + "`";
      bot.sendMessage(
        chatId,
        `id: ${uid} \nBotUsersname: ${user.name} \nТелефон: ${user.phoneNumber}`,
        { parse_mode: "Markdown" }
      );
    });
  }
  async function userCount3(msg) {
    try {
      const chatId = msg.chat.id;
      const users = await BotUsers.find();
      const tasks = await Task.find();
      const userLength = users.length;
      const taskLength = tasks.length;
  
      // Botni bloklangan foydalanuvchilarning sonini hisoblash
      const blockedBotUserssCount = users.filter(
        (user) => user.status === false
      ).length;
  
      // Foydalanuvchilar sonini bir marta chiqarish va bloklangan foydalanuvchilarni bildirish
      bot.sendMessage(
        chatId,
        `Статистика для @Grellaparat_zakas_bot: \nПользователи: \nВсе пользователи: ${userLength} \nБот заблокирован: ${blockedBotUserssCount} \n \nСообщения: \nВсе сообщения: ${taskLength} \n\nСчетчик пользователей, заблокировавших бота, обновляется при отправке широковещательного поста.`,
        { parse_mode: "Markdown" }
      );
  
      // Tasklarni ham qaytarish mumkin
      return tasks;
    } catch (error) {
      console.log(error);
    }
  }
  
  async function userSendMessage3(msg) {
    try {
      const chatId = msg.chat.id;
      const adminId = "5803698389";
      // MongoDB da status true bo'lgan foydalanuvchilarni tanlash
      const users = await BotUsers.find({ status: true });
  
      // Foydalanuvchidan xabar matnini so'rash
      await bot.sendMessage(adminId, `Введите текст сообщения: `, {
        parse_mode: "Markdown",
      });
      const messageResponse = await new Promise((resolve) => {
        bot.once("message", resolve);
      });
      const textMessage = messageResponse.text;
  
      // Foydalanuvchidan rasmni so'rash
      await bot.sendMessage(adminId, `Отправьте изображение по адресу:`, {
        parse_mode: "Markdown",
      });
      const photoMessage = await new Promise((resolve) => {
        bot.once("photo", (msg) => {
          if (msg.photo) {
            resolve(msg.photo[0].file_id);
          }
        });
      });
  
      // Foydalanuvchilarga rasm va matnni yuborish
      for (const user of users) {
        try {
          await bot.sendPhoto(user.chatId, photoMessage, {
            caption: textMessage,
          });
        } catch (error) {
          // Xatolikni tekshirish va uni qaytarish
          // console.log('Xabar yuborishda xato yuz berdi:', error);
        }
      }
    } catch (error) {
      // console.log(error);
    }
  }
  
  async function addTask3(msg) {
    const chatId = msg.chat.id;
    delete state3[chatId];
    const currentDate = new Date("2024-05-25 12:13");
    const adtxt =
      "`" +
      `\nFullName: Имя заявителя, семья \nTitle: Название приложения \nDescription: описание обращения \nPhone: +998331234567  ` +
      "`";
    bot.sendMessage(
      chatId,
      "Пожалуйста, отправьте информацию о запросе заявки в формате ниже:" +
        adtxt,
      {
        reply_markup: {
          inline_keyboard: [[{ text: "Назад", callback_data: "menu3" }]],
        },
        parse_mode: "Markdown",
      }
    );
    bot.once("message", async (msg) => {
      const text = msg.text;
      const lines = text.split("\n");
      const fullNameLine = lines.find((line) => line.startsWith("FullName:"));
      const titleLine = lines.find((line) => line.startsWith("Title:"));
      const descriptionLine = lines.find((line) =>
        line.startsWith("Description:")
      );
      const phoneLine = lines.find((line) => line.startsWith("Phone:"));
  
      if (!fullNameLine || !titleLine || !descriptionLine || !phoneLine) {
        bot.sendMessage(
          chatId,
          "Пожалуйста, предоставьте все сведения о запросе рекомендаций в правильном формате."
        );
        return addTask3(msg);
      }
      const fullName = fullNameLine.split(": ")[1];
      const title = titleLine.split(": ")[1];
      const description = descriptionLine.split(": ")[1];
      const phone = phoneLine.split(": ")[1];
  
      // Add task to MongoDB
      const newTask = new Task({ fullName, title, description, phone, chatId });
      await newTask.save();
      bot.sendMessage(chatId, "Запрос добавлен!");
    });
  }
  
  // list all
  async function listTasks3(msg) {
    const chatId = msg.chat.id;
    delete state3[chatId];
    const tasks = await Task.find({ chatId });
    if (tasks.length === 0) {
      bot.sendMessage(chatId, "Рефералов не обнаружено.");
    } else {
      tasks.forEach(async (task, index) => {
        // So'rov raqami tugagani tek
        const completionStatus = task.completed ? "Yes" : "No";
        bot.sendMessage(
          chatId,
          `Обращаться ${index + 1}: \nПолное имя: ${task.fullName} \nЗаголовок: ${
            task.title
          }\nОписание: ${task.description}\nТелефон: ${
            task.phone
          }\nЗавершенный: ${completionStatus}`
        );
      });
    }
  }
  // list all admin
  async function adminListTasks3(msg) {
    const chatId = msg.chat.id;
  
    const adminBotUsersId = await BotUsers.findOne({ chatId });
    if (!adminBotUsersId || adminBotUsersId.phoneNumber !== "+998330033953") {
      bot.sendMessage(chatId, "Вы не можете сделать такой запрос!");
      return;
    }
  
    const tasks = await Task.find();
    if (tasks.length == 0) {
      bot.sendMessage(chatId, "Рефералов не обнаружено.");
    } else {
      tasks.forEach(async (task, index) => {
        const userId = task.chatId;
        const userPhone = task.phone;
  
        const completionStatus = task.completed ? "Да" : "Нет";
        bot.sendMessage(
          chatId,
          `Автор ID: <a href="https://t.me/${userPhone}" >${userId}</a> \nНомер Запроса ${
            index + 1
          }:\nПолное имя: ${task.fullName}\nЗаголовок: ${task.title}\nОписание: ${
            task.description
          }\nТелефон: ${task.phone}\nЗавершенный: ${completionStatus}`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Удалить", callback_data: `deleteAdmin3` }],
              ],
            },
            parse_mode: "HTML",
          }
        );
      });
    }
  }
  
  // delete
  function deleteTask3(msg) {
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      "Введите номер запроса, который хотите удалить:"
    );
    // // Handle delete task
    bot.once("message", async (msg) => {
      const chatId = msg.chat.id;
      const taskIndex = parseInt(msg.text) - 1;
      // Find task by index and delete from MongoDB
      const tasks = await Task.find({ chatId });
      if (taskIndex >= 0 && tasks.length > taskIndex) {
        await Task.findByIdAndDelete(tasks[taskIndex]._id);
        bot.sendMessage(chatId, "Ваш запрос удален!");
        menuFunc3(msg);
      } else {
        bot.sendMessage(
          chatId,
          "Запрос не найден. Пожалуйста, проверьте и отправьте повторно."
        );
        return menuFunc3(msg);
      }
    });
  }
  // Admin delete
  async function adminDelete3(msg) {
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      "Введите номер запроса, который хотите удалить:"
    );
    bot.once("message", async (msg) => {
      const chatId = msg.chat.id;
      const taskIndex = parseInt(msg.text) - 1;
      // Find task by index and delete from MongoDB
      const tasks = await Task.find();
      if (taskIndex >= 0 && tasks.length > taskIndex) {
        await Task.findByIdAndDelete(tasks[taskIndex]._id);
        bot.sendMessage(chatId, "Ваш запрос удален!");
        backCheck3(msg);
      } else {
        bot.sendMessage(
          chatId,
          "Запрос не найден. Пожалуйста, проверьте и отправьте повторно."
        );
        return adminMenu3(msg);
      }
    });
  }
  
  
  const state3 = {};
  // edit
  async function editCancel3(msg) {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, "Ваше редактирование отменено!");
    delete state3[chatId];
    return menuFunc3(msg);
  }
  async function checkExistingEditing3(chatId) {
    if (state3[chatId]) {
      await bot.sendMessage(
        chatId,
        "Вы уже редактируете номер заявки. Пожалуйста, завершите текущий процесс редактирования, прежде чем начинать новый.",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Отмена", callback_data: `editCancel3` }],
            ],
          },
          parse_mode: "HTML",
        }
      );
      delete state3[chatId];
      return true;
    }
    return false;
  }
  
  async function editTask3(msg) {
    const chatId = msg.chat.id;
    // Check if there's an existing editing process
    if (await checkExistingEditing3(chatId)) {
      return;
    }
    // Ask
    await bot.sendMessage(
      chatId,
      "Введите номер запроса, который хотите отредактировать:"
    );
    // Set edittask
    state3[chatId] = "edittask";
  
    // edit task 
    bot.on("message", async (msg) => { // Change to bot.once to listen only once
        const chatId = msg.chat.id;
        const text = msg.text;
        if (state3[chatId] === "edittask") {
            const taskIndex = parseInt(text) - 1;
            // Find task by index
            const tasks = await Task.find({ chatId });
            if (tasks.length > taskIndex && taskIndex >= 0) {
                const taskToEdit = tasks[taskIndex];
                const txt =
                    "`" +
                    `\nFullName: ${taskToEdit.fullName} \nTitle: ${taskToEdit.title} \nDescription: ${taskToEdit.description} \nPhone: ${taskToEdit.phone}  ` +
                    "`";
                await bot.sendMessage(
                    chatId,
                    `Редактировать запрос: ${taskToEdit.fullName}\nУкажите детали нового номера запроса в формате ниже:\n` +
                    txt,
                    { parse_mode: "Markdown" }
                );
                state3[chatId] = {
                    action: "editing",
                    taskIndex,
                    taskId: taskToEdit._id,
                };
            } else {
                await bot.sendMessage(
                    chatId,
                    "Номер вашего запроса не найден. Пожалуйста, проверьте и отправьте повторно.",
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "Отмена", callback_data: `editCancel3` }],
                            ],
                        },
                        parse_mode: "HTML",
                    }
                );
            }
        } else if (state3[chatId] && state3[chatId].action === "editing") {
            // Parse task details
            const lines = text.split("\n");
            const fullNameLine = lines.find((line) => line.startsWith("FullName:"));
            const titleLine = lines.find((line) => line.startsWith("Title:"));
            const descriptionLine = lines.find((line) => line.startsWith("Description:"));
            const phoneLine = lines.find((line) => line.startsWith("Phone:"));

            if (!fullNameLine || !titleLine || !descriptionLine || !phoneLine) {
                await bot.sendMessage(
                    chatId,
                    "Ошибка формата. Пожалуйста, отправьте детали вашего запроса в правильном формате.."
                );
                return; // Exit early if format is incorrect
            }

            const fullName = fullNameLine.split(": ")[1];
            const title = titleLine.split(": ")[1];
            const description = descriptionLine.split(": ")[1];
            const phone = phoneLine.split(": ")[1];
            const taskId = state3[chatId].taskId;

            // Update task in MongoDB
            await Task.findByIdAndUpdate(taskId, {
                fullName,
                title,
                description,
                phone,
            });
            await bot.sendMessage(chatId, "Запрос изменен!");
            delete state3[chatId];
            // Clear the state
            return menuFunc3(msg);
        }
    });
  }
      //ru
      

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('hello world')
})
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
