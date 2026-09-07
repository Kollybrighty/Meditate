export function notificationHref(options: {
  type: string;
  groupId: string | null;
  classroomId?: string | null;
  referenceId: string | null;
}): string {
  const { type, groupId, classroomId, referenceId } = options;
  if (type === "kids_lobby" && classroomId && referenceId) {
    return `/kids/classrooms/${classroomId}/lesson/${referenceId}`;
  }
  if (
    (type === "kids_lobby" || type === "kids_teacher_invite") &&
    classroomId
  ) {
    return `/kids/classrooms/${classroomId}`;
  }
  if (
    groupId &&
    referenceId &&
    (type === "forum_question" || type === "forum_reply")
  ) {
    return `/groups/${groupId}/forum/${referenceId}`;
  }
  if (groupId) return `/groups/${groupId}`;
  return "/dashboard";
}

export function notificationCopy(type: string): { title: string; preview: string } {
  if (type === "forum_question") {
    return {
      title: "New question",
      preview: "Someone posted a question in your group.",
    };
  }
  if (type === "forum_reply") {
    return {
      title: "New reply",
      preview: "Someone replied in a Q&A thread.",
    };
  }
  if (type === "kids_lobby") {
    return {
      title: "Child waiting in lobby",
      preview: "Admit them to the live Kids session now.",
    };
  }
  if (type === "kids_teacher_invite") {
    return {
      title: "You're a co-teacher",
      preview: "You've been added as a teacher for a Kids classroom.",
    };
  }
  return {
    title: "Group update",
    preview: "There is a new update in your group.",
  };
}
