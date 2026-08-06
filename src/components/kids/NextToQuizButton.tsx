"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { launchQuiz } from "@/app/kids/classrooms/[id]/lesson/[lessonId]/session-actions";

export default function NextToQuizButton({
  classroomId,
  lessonId,
}: {
  classroomId: string;
  lessonId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await launchQuiz(classroomId, lessonId);
        });
      }}
    >
      {pending ? "Opening quiz…" : "Next: Start quiz"}
    </Button>
  );
}
