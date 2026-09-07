"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireClassroomStaff } from "@/lib/kids/staff";

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

  const staff = await requireClassroomStaff(supabase, classroomId, user.id);
  if (!staff.ok) return { error: staff.error };

  const { error } = await supabase
    .from("kids_lessons")
    .update({
      character_id: characterId,
      lesson_type: "character",
      title: character.name,
    })
    .eq("id", lessonId)
    .eq("classroom_id", classroomId);

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

  const staff = await requireClassroomStaff(supabase, classroomId, user.id);
  if (!staff.ok) throw new Error(staff.error);
  if (!lesson) {
    throw new Error("Lesson not found.");
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

  const questions: {
    quiz_id: string;
    question_text: string;
    question_type: string;
    options: unknown;
    correct_answer: string | null;
    source: "pool" | "teacher_custom";
    pool_question_id: string | null;
  }[] =
    pool && pool.length > 0
      ? pool.map((q) => ({
          quiz_id: quiz.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          correct_answer: q.correct_answer,
          source: "pool",
          pool_question_id: q.id,
        }))
      : [
          {
            quiz_id: quiz.id,
            question_text: `What is one thing we can learn from ${character?.name ?? "this character"}?`,
            question_type: "short_answer",
            options: null,
            correct_answer: null,
            source: "teacher_custom",
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
            source: "teacher_custom",
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
  const lessonId = String(formData.get("lessonId") ?? "");
  const title = (formData.get("title") as string)?.trim();
  const file = formData.get("file") as File | null;

  if (!classroomId || !title) return { error: "Title is required." };
  if (!file || file.size === 0) return { error: "Choose a file to upload." };

  const staff = await requireClassroomStaff(supabase, classroomId, user.id);
  if (!staff.ok) return { error: staff.error };

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

  const { data: material, error } = await supabase
    .from("lesson_materials")
    .insert({
      classroom_id: classroomId,
      uploaded_by: user.id,
      title,
      file_url: publicUrl,
      file_type: fileType,
      file_size: file.size,
    })
    .select("id")
    .single();

  if (error || !material) return { error: error?.message || "Could not save the file." };

  if (lessonId) {
    const { error: linkError } = await supabase.from("lesson_material_links").insert({
      lesson_id: lessonId,
      material_id: material.id,
    });
    if (linkError) return { error: linkError.message };
    revalidatePath(`/kids/classrooms/${classroomId}/lesson/${lessonId}`);
  }

  revalidatePath(`/kids/classrooms/${classroomId}`);
  return { success: lessonId ? "Material uploaded and attached to this lesson." : "Material uploaded." };
}

export async function deleteLessonMaterial(
  _prev: LessonActionState,
  formData: FormData
): Promise<LessonActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const classroomId = String(formData.get("classroomId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const materialId = String(formData.get("materialId") ?? "");
  if (!classroomId || !materialId) return { error: "Choose a file to remove." };

  const staff = await requireClassroomStaff(supabase, classroomId, user.id);
  if (!staff.ok) return { error: staff.error };

  const { error } = await supabase
    .from("lesson_materials")
    .delete()
    .eq("id", materialId)
    .eq("classroom_id", classroomId);
  if (error) return { error: error.message };

  revalidatePath(`/kids/classrooms/${classroomId}`);
  if (lessonId) revalidatePath(`/kids/classrooms/${classroomId}/lesson/${lessonId}`);
  return { success: "Material removed." };
}

function revalidateLesson(classroomId: string, lessonId: string) {
  revalidatePath(`/kids/classrooms/${classroomId}`);
  revalidatePath(`/kids/classrooms/${classroomId}/lesson/${lessonId}`);
}

export async function shareBoardContribution(
  _prev: LessonActionState,
  formData: FormData
): Promise<LessonActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const classroomId = String(formData.get("classroomId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const contributionId = String(formData.get("contributionId") ?? "");
  const share = formData.get("share") === "true";
  const pin = formData.get("pin");

  const staff = await requireClassroomStaff(supabase, classroomId, user.id);
  if (!staff.ok) return { error: staff.error };
  if (!contributionId) return { error: "Missing contribution." };

  const patch: {
    visibility?: string;
    shared_by_teacher?: boolean;
    is_pinned?: boolean;
  } = {};
  if (pin === "true" || pin === "false") {
    patch.is_pinned = pin === "true";
  } else {
    patch.visibility = share ? "class" : "teacher_only";
    patch.shared_by_teacher = share;
  }

  const { error } = await supabase
    .from("board_contributions")
    .update(patch)
    .eq("id", contributionId)
    .eq("lesson_id", lessonId);

  if (error) return { error: error.message };
  revalidateLesson(classroomId, lessonId);
  if (pin === "true") return { success: "Pinned for the class." };
  if (pin === "false") return { success: "Unpinned." };
  return { success: share ? "Shared with the class." : "Hidden from the class." };
}

export async function attachLessonMaterial(
  _prev: LessonActionState,
  formData: FormData
): Promise<LessonActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const classroomId = String(formData.get("classroomId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const materialId = String(formData.get("materialId") ?? "");
  const attach = formData.get("attach") !== "false";

  const staff = await requireClassroomStaff(supabase, classroomId, user.id);
  if (!staff.ok) return { error: staff.error };
  if (!lessonId || !materialId) return { error: "Choose a material." };

  if (attach) {
    const { error } = await supabase.from("lesson_material_links").insert({
      lesson_id: lessonId,
      material_id: materialId,
    });
    if (error) return { error: error.message };
    revalidateLesson(classroomId, lessonId);
    return { success: "Material attached to this lesson." };
  }

  const { error } = await supabase
    .from("lesson_material_links")
    .delete()
    .eq("lesson_id", lessonId)
    .eq("material_id", materialId);
  if (error) return { error: error.message };
  revalidateLesson(classroomId, lessonId);
  return { success: "Material removed from this lesson." };
}

export async function raiseHand(
  _prev: LessonActionState,
  formData: FormData
): Promise<LessonActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const classroomId = String(formData.get("classroomId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const childId = String(formData.get("childId") ?? "");
  if (!classroomId || !lessonId || !childId) {
    return { error: "Choose who is raising a hand." };
  }

  const { data: child } = await supabase
    .from("child_profiles")
    .select("id, display_name")
    .eq("id", childId)
    .eq("parent_user_id", user.id)
    .maybeSingle();
  if (!child) return { error: "Child profile not found." };

  const { data: lobby } = await supabase
    .from("session_lobby")
    .select("id")
    .eq("lesson_id", lessonId)
    .eq("child_profile_id", childId)
    .eq("status", "admitted")
    .maybeSingle();
  if (!lobby) return { error: "Admit this child before they can raise a hand." };

  const { data: existing } = await supabase
    .from("raised_hands")
    .select("id, status")
    .eq("lesson_id", lessonId)
    .eq("child_profile_id", childId)
    .in("status", ["raised", "called_on"])
    .maybeSingle();

  if (existing) {
    return { success: `${child.display_name} already has a hand up.` };
  }

  const { error } = await supabase.from("raised_hands").insert({
    lesson_id: lessonId,
    child_profile_id: childId,
    status: "raised",
  });
  if (error) return { error: error.message };
  revalidateLesson(classroomId, lessonId);
  return { success: `${child.display_name} raised a hand.` };
}

export async function updateRaisedHand(
  _prev: LessonActionState,
  formData: FormData
): Promise<LessonActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const classroomId = String(formData.get("classroomId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const handId = String(formData.get("handId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!handId || !["called_on", "dismissed", "lowered"].includes(status)) {
    return { error: "Choose what to do with this hand." };
  }

  const { data: hand } = await supabase
    .from("raised_hands")
    .select("id, child_profile_id, lesson_id")
    .eq("id", handId)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (!hand) return { error: "Hand not found." };

  const staff = await requireClassroomStaff(supabase, classroomId, user.id);
  const { data: child } = await supabase
    .from("child_profiles")
    .select("id")
    .eq("id", hand.child_profile_id)
    .eq("parent_user_id", user.id)
    .maybeSingle();

  if (!staff.ok && !child) {
    return { error: "You cannot update this hand." };
  }
  if (!staff.ok && status === "called_on") {
    return { error: "Only the teacher can call on a child." };
  }

  const { error } = await supabase
    .from("raised_hands")
    .update({
      status,
      dismissed_at:
        status === "dismissed" || status === "lowered"
          ? new Date().toISOString()
          : null,
      dismissed_by:
        status === "lowered" ? "student" : status === "dismissed" ? "teacher" : null,
    })
    .eq("id", handId);

  if (error) return { error: error.message };
  revalidateLesson(classroomId, lessonId);
  if (status === "called_on") return { success: "Called on." };
  if (status === "lowered") return { success: "Hand lowered." };
  return { success: "Hand dismissed." };
}
