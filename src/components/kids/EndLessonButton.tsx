"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { endKidsLesson } from "@/app/kids/classrooms/[id]/lesson/[lessonId]/actions";

export default function EndLessonButton({
  classroomId,
  lessonId,
}: {
  classroomId: string;
  lessonId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await endKidsLesson(classroomId, lessonId);
        });
      }}
    >
      {pending ? "Ending…" : "End session"}
    </Button>
  );
}
