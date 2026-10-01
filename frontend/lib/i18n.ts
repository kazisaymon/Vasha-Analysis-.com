export const UI_LANGS = [
  { code: "en", label: "English" },
  { code: "bn", label: "বাংলা" },
  { code: "hi", label: "हिन्दी" },
  { code: "zh", label: "中文" },
];

const en = {
  newChat: "New chat", chat: "Chat", translate: "Translate", history: "Recent chats", noChats: "No chats yet",
  remove: "Delete chat", theme: "Switch theme", uiLang: "Interface language", menu: "Menu",
  title: "Ask in any language", sub: "Type, speak, or add images, PDFs and files. Chittagonian is supported.",
  s1: "Translate a sentence", s2: "Summarise a PDF", s3: "Explain an image", s4: "Ask by voice",
  s1Fill: "Translate to Bengali: ", placeholder: "Write a message…", attach: "Add files", record: "Record voice",
  stop: "Stop", send: "Send", replyIn: "Reply in", auto: "Same as my message", inContext: "Files in this chat",
  removeFile: "Remove file", copy: "Copy", copied: "Copied", listen: "Listen", drop: "Drop files to add them",
  from: "From", to: "To", detect: "Detect language", swap: "Swap languages", doTranslate: "Translate",
  transPlaceholder: "Enter text to translate…", result: "Translation appears here", transcribing: "Transcribing…",
  translating: "Translating…", micDenied: "Microphone access was blocked. Allow it in your browser settings.",
  ctgNote: "Speech in Chittagonian is transcribed as Bengali.", newBadge: "Untitled",
};
type Dict = typeof en;

const bn: Dict = {
  newChat: "নতুন চ্যাট", chat: "চ্যাট", translate: "অনুবাদ", history: "সাম্প্রতিক চ্যাট", noChats: "কোনো চ্যাট নেই",
  remove: "চ্যাট মুছুন", theme: "থিম পরিবর্তন", uiLang: "ইন্টারফেসের ভাষা", menu: "মেনু",
  title: "যেকোনো ভাষায় জিজ্ঞাসা করুন", sub: "লিখুন, বলুন, অথবা ছবি, PDF ও ফাইল যোগ করুন। চাটগাঁইয়া সমর্থিত।",
  s1: "একটি বাক্য অনুবাদ", s2: "PDF সারসংক্ষেপ", s3: "ছবি ব্যাখ্যা", s4: "ভয়েসে জিজ্ঞাসা",
  s1Fill: "বাংলায় অনুবাদ করুন: ", placeholder: "বার্তা লিখুন…", attach: "ফাইল যোগ করুন", record: "ভয়েস রেকর্ড",
  stop: "থামুন", send: "পাঠান", replyIn: "উত্তরের ভাষা", auto: "আমার বার্তার ভাষায়", inContext: "এই চ্যাটের ফাইল",
  removeFile: "ফাইল সরান", copy: "কপি", copied: "কপি হয়েছে", listen: "শুনুন", drop: "ফাইল যোগ করতে এখানে ছাড়ুন",
  from: "থেকে", to: "এ", detect: "ভাষা শনাক্ত করুন", swap: "ভাষা অদলবদল", doTranslate: "অনুবাদ করুন",
  transPlaceholder: "অনুবাদের জন্য লিখুন…", result: "অনুবাদ এখানে দেখা যাবে", transcribing: "লেখায় রূপান্তর হচ্ছে…",
  translating: "অনুবাদ হচ্ছে…", micDenied: "মাইক্রোফোনের অনুমতি বন্ধ। ব্রাউজার সেটিংস থেকে অনুমতি দিন।",
  ctgNote: "চাটগাঁইয়া ভয়েস বাংলা হিসেবে লেখায় রূপান্তরিত হয়।", newBadge: "শিরোনামহীন",
};

const hi: Dict = {
  newChat: "नई चैट", chat: "चैट", translate: "अनुवाद", history: "हाल की चैट", noChats: "अभी कोई चैट नहीं",
  remove: "चैट हटाएँ", theme: "थीम बदलें", uiLang: "इंटरफ़ेस भाषा", menu: "मेन्यू",
  title: "किसी भी भाषा में पूछें", sub: "लिखें, बोलें, या चित्र, PDF और फ़ाइलें जोड़ें। चटगाँवी समर्थित है।",
  s1: "एक वाक्य का अनुवाद", s2: "PDF का सार", s3: "चित्र समझाएँ", s4: "आवाज़ से पूछें",
  s1Fill: "बंगाली में अनुवाद करें: ", placeholder: "संदेश लिखें…", attach: "फ़ाइलें जोड़ें", record: "आवाज़ रिकॉर्ड करें",
  stop: "रोकें", send: "भेजें", replyIn: "उत्तर की भाषा", auto: "मेरे संदेश की भाषा में", inContext: "इस चैट की फ़ाइलें",
  removeFile: "फ़ाइल हटाएँ", copy: "कॉपी", copied: "कॉपी हो गया", listen: "सुनें", drop: "फ़ाइलें जोड़ने के लिए यहाँ छोड़ें",
  from: "से", to: "में", detect: "भाषा पहचानें", swap: "भाषाएँ बदलें", doTranslate: "अनुवाद करें",
  transPlaceholder: "अनुवाद के लिए लिखें…", result: "अनुवाद यहाँ दिखेगा", transcribing: "लिखित रूप बन रहा है…",
  translating: "अनुवाद हो रहा है…", micDenied: "माइक्रोफ़ोन की अनुमति बंद है। ब्राउज़र सेटिंग्स में अनुमति दें।",
  ctgNote: "चटगाँवी आवाज़ बंगाली के रूप में लिखी जाती है।", newBadge: "बिना शीर्षक",
};

const zh: Dict = {
  newChat: "新对话", chat: "对话", translate: "翻译", history: "最近对话", noChats: "暂无对话",
  remove: "删除对话", theme: "切换主题", uiLang: "界面语言", menu: "菜单",
  title: "用任何语言提问", sub: "输入文字、语音，或添加图片、PDF 和文件。支持吉大港语。",
  s1: "翻译一句话", s2: "总结 PDF", s3: "解释图片", s4: "语音提问",
  s1Fill: "翻译成孟加拉语：", placeholder: "输入消息…", attach: "添加文件", record: "录音",
  stop: "停止", send: "发送", replyIn: "回复语言", auto: "与我的消息相同", inContext: "本对话中的文件",
  removeFile: "移除文件", copy: "复制", copied: "已复制", listen: "朗读", drop: "拖放文件以添加",
  from: "源语言", to: "目标语言", detect: "自动检测", swap: "交换语言", doTranslate: "翻译",
  transPlaceholder: "输入要翻译的文字…", result: "译文将显示在这里", transcribing: "正在转写…",
  translating: "正在翻译…", micDenied: "麦克风权限被拒绝，请在浏览器设置中允许。",
  ctgNote: "吉大港语语音会按孟加拉语转写。", newBadge: "未命名",
};

const dicts: Record<string, Dict> = { en, bn, hi, zh };
export type T = Dict;
export const getT = (code: string): Dict => dicts[code] || en;
