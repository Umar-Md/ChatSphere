import { useEffect, useState } from 'react';
import { usePreferences } from '../../../context/AppPreferences';
import { searchUsers } from '../../../services/profileService';
import { addGroupMembers, createGroup, deleteGroup, getGroupDetails, leaveGroup, removeGroupMember, renameGroup } from '../../../services/conversationService';

export default function GroupManager({ group, currentUserId, onClose, onUpdated, onDeleted }) {
  const { t } = usePreferences();
  const [details, setDetails] = useState(group);
  const [name, setName] = useState(group?.groupName || '');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [busy, setBusy] = useState(false);
  const isCreator = String(details?.createdBy?._id || details?.createdBy) === String(currentUserId);

  useEffect(() => { if (group?._id) getGroupDetails(group._id).then(setDetails).catch(() => {}); }, [group?._id]);
  useEffect(() => {
    if (query.trim().length < 2) { setUsers([]); return; }
    const timer = setTimeout(() => searchUsers(query).then(setUsers).catch(() => setUsers([])), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const refresh = async () => { const next = await getGroupDetails(group._id); setDetails(next); onUpdated?.(next); };
  const run = async (fn) => { setBusy(true); try { await fn(); await refresh(); } catch (e) { alert(e.response?.data?.message || e.message || 'Action failed'); } finally { setBusy(false); } };

  if (!group) return null;
  return <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
    <div className="surface-card bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="p-5 border-b flex justify-between items-center"><h2 className="font-bold text-xl">👥 {details?.groupName || t('group')}</h2><button onClick={onClose}>×</button></div>
      <div className="p-5 space-y-5">
        {isCreator && <div><label className="text-sm font-semibold">Group name</label><div className="flex gap-2 mt-2"><input className="flex-1 border rounded-lg px-3 py-2" value={name} onChange={e=>setName(e.target.value)} /><button disabled={busy || !name.trim()} onClick={()=>run(()=>renameGroup(group._id,name.trim()))} className="px-4 rounded-lg bg-indigo-600 text-white">Rename</button></div></div>}
        <div><h3 className="font-semibold mb-2">Members ({details?.participants?.length || 0})</h3>{details?.participants?.map(member => <div key={member._id} className="flex items-center gap-3 py-2"><img className="w-9 h-9 rounded-full" src={member.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name||'User')}`} /><div className="flex-1"><div className="font-medium">{member.name}</div><div className="text-xs text-gray-500">{member.email}</div></div>{String(member._id)===String(details?.createdBy?._id||details?.createdBy) && <span className="text-xs">Owner</span>}{isCreator && String(member._id)!==String(details?.createdBy?._id||details?.createdBy) && <button disabled={busy} onClick={()=>run(()=>removeGroupMember(group._id,member._id))} className="text-red-500 text-sm">Remove</button>}</div>)}</div>
        {isCreator && <div><label className="text-sm font-semibold">Add members</label><input className="w-full border rounded-lg px-3 py-2 mt-2" placeholder="Search users..." value={query} onChange={e=>setQuery(e.target.value)} />{users.map(u=><button key={u._id} onClick={()=>setSelectedUsers(prev=>prev.includes(u._id)?prev.filter(id=>id!==u._id):[...prev,u._id])} className={`w-full text-left p-2 mt-1 rounded-lg border ${selectedUsers.includes(u._id)?'bg-indigo-50 border-indigo-400':''}`}>{u.name} <span className="text-gray-500 text-xs">{u.email}</span></button>)}<button disabled={busy||!selectedUsers.length} onClick={()=>run(async()=>{await addGroupMembers(group._id,selectedUsers);setSelectedUsers([]);setQuery('');})} className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg">Add selected</button></div>}
        <div className="pt-3 border-t flex flex-wrap gap-2"><button disabled={busy || isCreator} onClick={()=>run(async()=>{await leaveGroup(group._id);onDeleted?.();onClose();})} className="px-4 py-2 rounded-lg bg-gray-100">Leave group</button>{isCreator && <button disabled={busy} onClick={()=>{if(confirm('Delete this group and its messages?')) run(async()=>{await deleteGroup(group._id);onDeleted?.();onClose();});}} className="px-4 py-2 rounded-lg bg-red-100 text-red-600">Delete group</button>}</div>
      </div>
    </div>
  </div>;
}

export function GroupCreateModal({ onClose, onCreated }) {
  const [name,setName]=useState(''); const [query,setQuery]=useState(''); const [users,setUsers]=useState([]); const [members,setMembers]=useState([]); const [busy,setBusy]=useState(false);
  useEffect(()=>{if(query.trim().length<2){setUsers([]);return;}const timer=setTimeout(()=>searchUsers(query).then(setUsers).catch(()=>setUsers([])),250);return()=>clearTimeout(timer)},[query]);
  const create=async()=>{if(!name.trim()||members.length<2)return alert('Select at least 2 other members.');setBusy(true);try{const group=await createGroup({groupName:name.trim(),participants:members});onCreated(group);onClose()}catch(e){alert(e.response?.data?.message||'Failed to create group')}finally{setBusy(false)}};
  return <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div className="surface-card bg-white rounded-2xl w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto p-5"><div className="flex justify-between mb-4"><h2 className="font-bold text-xl">Create group</h2><button onClick={onClose}>×</button></div><input autoFocus className="w-full border rounded-lg px-3 py-2 mb-3" placeholder="Group name" value={name} onChange={e=>setName(e.target.value)}/><input className="w-full border rounded-lg px-3 py-2" placeholder="Search members by name or email" value={query} onChange={e=>setQuery(e.target.value)}/><div className="mt-3 max-h-56 overflow-y-auto">{users.map(u=><button key={u._id} onClick={()=>setMembers(m=>m.includes(u._id)?m.filter(x=>x!==u._id):[...m,u._id])} className={`w-full text-left p-3 rounded-lg border mb-1 ${members.includes(u._id)?'bg-indigo-50 border-indigo-400':''}`}>{u.name}<span className="text-xs text-gray-500 ml-2">{u.email}</span></button>)}</div><p className="text-xs text-gray-500 mt-2">{members.length} members selected (minimum 2 other members)</p><button disabled={busy||!name.trim()||members.length<2} onClick={create} className="w-full mt-4 py-3 rounded-lg bg-indigo-600 text-white disabled:opacity-40">{busy?'Creating...':'Create group'}</button></div></div>;
}
