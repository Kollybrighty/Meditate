"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type LessonActionState = {
  error?: string;
  success?: string;
};

export async function selectCharacter(
  _prev: LessonActionState,
  formData: FormData
): Promise<LessonActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const classroomId = formData.get("classroomId") as string;
  const lessonId = formData.get("lessonId") as string;
  const characterId = formData.get("characterId") as string;

  if (!classroomId || !lessonId || !characterId) {
    return { error: "Choose a Bible character to continue." };
  }

  const { data: character } = await supabase
    .from("bible_characters")
    .select("id, name")
    .eq("id", characterId)
    .single();

  if (!character) return { error: "Character not found." };

  const { error } = await supabase
    .from("kids_lessons")
    .update({
      character_id: characterId,
      lesson_type: "character",
      title: character.name,
    })
    .eq("id", lessonId)
    .eq("classroom_id", classroomId)
    .eq("host_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/kids/classrooms/${classroomId}/lesson/${lessonId}`);
  return { success: `${character.name} selected.` };
}

export async function addBoardContribution(
  _prev: LessonActionState,
  formData: FormData
): Promise<LessonActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const classroomId = formData.get("classroomId") as string;
  const lessonId = formData.get("lessonId") as string;
  const body = (formData.get("body") as string)?.trim();
  const isTeacher = formData.get("isTeacher") === "true";

  if (!body) return { error: "Write something to share." };

  const { error } = await supabase.from("board_contributions").insert({
    lesson_id: lessonId,
    author_id: user.id,
    body,
    is_teacher: isTeacher,
    visibility: isTeacher ? "class" : "teacher_only",
    shared_by_teacher: isTeacher,
  });

  if (error) return { error: error.message };

  revalidatePath(`/kids/classrooms/${classroomId}/lesson/${lessonId}`);
  return { success: "Added to the board." };
}

export async function launchQuiz(classroomId: string, lessonId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: lesson } = await supabase
    .from("kids_lessons")
    .select("id, character_id, title, host_id")
    .eq("id", lessonId)
    .eq("classroom_id", classroomId)
    .single();

  if (!lesson || lesson.host_id !== user.id) {
    throw new Error("Only the teacher can launch the quiz.");
  }
  if (!lesson.character_id) {
    throw new Error("Select a Bible character before starting the quiz.");
  }

  // Reuse open quiz if already launched
  const { data: existing } = await supabase
    .from("lesson_quizzes")
    .select("id")
    .eq("lesson_id", lessonId)
    .is("closed_at", null)
    .maybeSingle();

  if (existing) {
    redirect(`/kids/classrooms/${classroomId}/lesson/${lessonId}/quiz/${existing.id}`);
  }

  const { data: pool } = await supabase
    .from("character_quiz_pool")
    .select("*")
    .eq("character_id", lesson.character_id)
    .order("sort_order", { ascending: true });

  const { data: character } = await supabase
    .from("bible_characters")
    .select("name, story_summary, life_application_template")
    .eq("id", lesson.character_id)
    .single();

  const { data: quiz, error: quizError } = await supabase
    .from("lesson_quizzes")
    .insert({
      lesson_id: lessonId,
      title: `${lesson.title} quiz`,
      quiz_source: pool && pool.length > 0 ? "auto_pool" : "teacher_custom",
      character_id: lesson.character_id,
      created_by: user.id,
      launched_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (quizError || !quiz) throw new Error(quizError?.message || "Failed to create quiz.");

  const questions =
    pool && pool.length > 0
      ? pool.map((q) => ({
          quiz_id: quiz.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          correct_answer: q.correct_answer,
          source: "pool" as const,
          pool_question_id: q.id,
        }))
      : [
          {
            quiz_id: quiz.id,
            question_text: `What is one thing we can learn from ${character?.name ?? "this character"}?`,
            question_type: "short_answer",
            options: null,
            correct_answer: null,
            source: "teacher_custom" as const,
            pool_question_id: null,
          },
          {
            quiz_id: quiz.id,
            question_text: character?.life_application_template
              ? `True or false: ${character.life_application_template}`
              : "We can trust God in hard times.",
            question_type: "true_false",
            options: null,
            correct_answer: "true",
            source: "teacher_custom" as const,
            pool_question_id: null,
          },
        ];

  const { error: qError } = await supabase.from("quiz_questions").insert(questions);
  if (qError) throw new Error(qError.message);

  redirect(`/kids/classrooms/${classroomId}/lesson/${lessonId}/quiz/${quiz.id}`);
}

export async function uploadLessonMaterial(
  _prev: LessonActionState,
  formData: FormData
): Promise<LessonActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const classroomId = formData.get("classroomId") as string;
  const title = (formData.get("title") as string)?.trim();
  const file = formData.get("file") as File | null;

  if (!classroomId || !title) return { error: "Title is required." };
  if (!file || file.size === 0) return { error: "Choose a file to upload." };

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const fileType =
    ["png", "jpg", "jpeg", "gif", "webp"].includes(ext)
      ? "image"
      : ext === "pdf"
        ? "pdf"
        : ext === "docx" || ext === "doc"
          ? "docx"
          : null;

  if (!fileType) {
    return { error: "Upload a PDF, image, or DOCX file." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { error: "File must be 10 MB or smaller." };
  }

  const path = `${classroomId}/${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("kids-materials")
    .upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("kids-materials").getPublicUrl(path);

  const { error } = await supabase.from("lesson_materials").insert({
    classroom_id: classroomId,
    uploaded_by: user.id,
    title,
    file_url: publicUrl,
    file_type: fileType,
    file_size: file.size,
  });

  if (error) return { error: error.message };

  revalidatePath(`/kids/classrooms/${classroomId}`);
  return { success: "Material uploaded." };
}
