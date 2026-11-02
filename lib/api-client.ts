import { authService } from '@/modules/auth/auth.service';
import { groupsService } from '@/modules/groups/groups.service';
import { chatService } from '@/modules/chat/chat.service';

export const api = {
  login: authService.login,
  register: authService.register,
  searchUsers: authService.searchUsers,
  logout: authService.logout,
  getGroups: groupsService.getGroups,
  getGroup: groupsService.getGroupById,
  createGroup: groupsService.createGroup,
  startDirectMessage: groupsService.startDirectMessage,
  joinGroup: groupsService.joinGroup,
  leaveGroup: groupsService.leaveGroup,
  deleteGroup: groupsService.deleteGroup,
  adminRemoveMemberSocket: groupsService.adminRemoveMemberSocket,
  getMessages: chatService.getMessages,
  sendMessage: chatService.sendMessage,
};
