import api from './api';

export const createGroup = async ({ groupName, participants }) => (await api.post('/conversations/group', { groupName, participants })).data.data;
export const getGroups = async () => (await api.get('/conversations/groups')).data.data || [];
export const getGroupDetails = async (groupId) => (await api.get(`/conversations/group/${groupId}`)).data.data;
export const renameGroup = async (groupId, groupName) => (await api.put(`/conversations/group/${groupId}`, { groupName })).data.data;
export const addGroupMembers = async (groupId, members) => (await api.put(`/conversations/group/${groupId}/add-members`, { members })).data.data;
export const removeGroupMember = async (groupId, memberId) => (await api.put(`/conversations/group/${groupId}/remove-member`, { memberId })).data.data;
export const leaveGroup = async (groupId) => (await api.put(`/conversations/group/${groupId}/leave`)).data.data;
export const deleteGroup = async (groupId) => (await api.delete(`/conversations/group/${groupId}`)).data;
export const hideGroup = async (groupId) => (await api.put(`/conversations/group/${groupId}/hide`)).data;
