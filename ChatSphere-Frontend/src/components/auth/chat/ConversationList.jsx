import { useEffect, useState } from "react";
import { usePreferences } from "../../../context/AppPreferences";
import NewChatModal from "./NewChatModal";
import { getOrCreateDirectConversation } from "../../../services/chatService";
import { getUnreadMessageCount } from "../../../services/messageService";
import { GroupCreateModal } from "./GroupManager";

function ConversationList({ conversations, selectedId, onSelect, loading, onConversationCreated }) {
  const { t } = usePreferences();
  const [query, setQuery] = useState(""); const [newChatOpen,setNewChatOpen]=useState(false); const [groupOpen,setGroupOpen]=useState(false); const [unread,setUnread]=useState(0);
  const currentUserId=getCurrentUserId();
  useEffect(()=>{let alive=true;const load=()=>getUnreadMessageCount().then(n=>alive&&setUnread(n?.unreadConversationCount || 0)).catch(()=>{});load();const id=setInterval(load,10000);return()=>{alive=false;clearInterval(id)}},[conversations.length]);
  const filtered=conversations.filter(c=>{const other=c.isGroup?null:(c.participants||[]).find(p=>String(p._id)!==String(currentUserId))||(c.participants||[])[0];const hay=(c.isGroup?c.groupName:other?.name||other?.email||"").toLowerCase();return hay.includes(query.toLowerCase())});
  const createDirect=async(user)=>{const c=await getOrCreateDirectConversation(user._id);onConversationCreated?.(c);onSelect(c)};
  const addGroup=(group)=>{onConversationCreated?.(group);onSelect(group)};
  return <aside className="w-full min-h-0 flex-1 bg-white border-r app-surface flex flex-col">
    <div className="p-4 border-b"><div className="flex items-center justify-between"><h2 className="font-bold text-lg">{t("chats")}</h2></div>{unread>0&&<div className="text-xs font-semibold text-indigo-600 mt-2">{unread} unread chats</div>}<div className="flex gap-2 mt-3"><button onClick={()=>setNewChatOpen(true)} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg">＋ {t("newChat")}</button><button onClick={()=>setGroupOpen(true)} className="px-3 py-2 rounded-lg bg-gray-100" title="Create group">👥</button></div><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("searchConversations")} className="w-full border rounded-lg px-3 py-2 mt-3"/></div>
    <div className="flex-1 overflow-y-auto p-2">{loading?<div className="p-4 text-gray-500">{t("loadingConversations")}</div>:filtered.length===0?<div className="p-4 text-gray-500">{t("noConversations")}</div>:filtered.map(c=>{const other=c.isGroup?null:(c.participants||[]).find(p=>String(p._id)!==String(currentUserId))||(c.participants||[])[0];return <button key={c._id} onClick={()=>onSelect(c)} className={`w-full flex gap-3 p-3 rounded-xl text-left ${String(c._id)===String(selectedId)?"bg-indigo-50":"hover:bg-gray-50"}`}><img className="w-11 h-11 rounded-full object-cover" src={c.isGroup?(c.groupImage||`https://ui-avatars.com/api/?name=${encodeURIComponent(c.groupName||"Group")}`):(other?.profilePic||`https://ui-avatars.com/api/?name=${encodeURIComponent(other?.name||"User")}`)} /><span className="min-w-0 flex-1"><strong className="block truncate">{c.isGroup?c.groupName:(other?.name||t("unknownUser"))}</strong><span className="block truncate text-xs text-gray-500">{c.lastMessage||t("startConversation")}</span></span>{c.unreadCount>0&&<span className="min-w-5 h-5 px-1 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center">{c.unreadCount>99?"99+":c.unreadCount}</span>}</button>})}</div>
    {newChatOpen&&<NewChatModal onClose={()=>setNewChatOpen(false)} onConversationCreated={createDirect}/>} {groupOpen&&<GroupCreateModal onClose={()=>setGroupOpen(false)} onCreated={addGroup}/>}</aside>;
}
function getCurrentUserId(){try{const token=sessionStorage.getItem("token");if(!token)return null;const p=JSON.parse(atob(token.split(".")[1]));return p.id||p._id||p.userId}catch{return null}}
export default ConversationList;
