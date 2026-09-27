import type { Metadata } from "next";
import {
  LegalPage,
  LegalSection,
  contactEmail,
} from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Meditate",
  description: "How Meditate handles account, group, and Kids classroom information.",
};

export default function PrivacyPage() {
  const email = contactEmail();

  return (
    <LegalPage title="Privacy Policy">
      <LegalSection heading="Who this covers">
        <p>
          Meditate is a group Bible study app. This policy describes the
          information the app stores when you create an account, join a group,
          or use a Kids classroom. It is written for this product. It is not
          legal advice.
        </p>
      </LegalSection>

      <LegalSection heading="Accounts">
        <p>When you register, Meditate stores:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Your email address and a password, handled by the sign-in service</li>
          <li>Your name and username</li>
          <li>Your local church, if you choose to add it</li>
          <li>The time you accepted these terms</li>
        </ul>
        <p>
          Sign-in uses a session cookie so you stay logged in. Meditate does not
          sell personal information and does not show advertising.
        </p>
      </LegalSection>

      <LegalSection heading="Groups and study">
        <p>If you join or lead a group, the app stores:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Your membership and role</li>
          <li>Which daily readings you mark complete</li>
          <li>Questions, replies, and optional voice notes you post</li>
          <li>Verses you highlight or underline</li>
          <li>In-app notifications about your groups</li>
        </ul>
        <p>
          Other members of that group can see your name, username, and what you
          post there.
        </p>
      </LegalSection>

      <LegalSection heading="Kids classrooms">
        <p>
          Children do not create Meditate accounts and the app does not ask a
          child for an email address. A parent or guardian account creates a
          child profile with a display name and an optional age from 1 to 18.
          Use a first name or nickname if you do not want a full legal name stored.
        </p>
        <p>For a child enrolled in a class, the app may store:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>The display name and optional age</li>
          <li>Which classroom they are enrolled in</li>
          <li>Whether they are waiting in or admitted to a live session</li>
          <li>Raised hands, board messages, and quiz answers during a lesson</li>
        </ul>
        <p>
          The classroom host and co-teachers can see that information so they
          can run the class. Other families in the class may see a display name
          when a teacher shares a board message with the class. Meditate does
          not collect a child’s photo, precise location, or independent login.
        </p>
        <p>
          Lesson files uploaded by a teacher (PDF, image, or document) are stored
          for that classroom. Do not upload a child’s personal documents unless
          you have a reason to share them with the teachers of that class.
        </p>
        <p>
          Child profiles belong to the parent account. Email the contact
          address to delete a child profile or the parent account. Deleting the
          parent account also removes the child profiles attached to it.
        </p>
      </LegalSection>

      <LegalSection heading="Scripture and email">
        <p>
          Public-domain readings (World English Bible and King James Version)
          are loaded from bible-api.com. The New Living Translation is loaded
          from API.Bible only when the site operator has added a key. Other
          licensed editions open on Bible Gateway in a new tab, under that
          site’s own policy.
        </p>
        <p>
          Password reset and optional notices about questions, replies, and Kids
          sessions are emailed through the sign-in service or through Resend
          when the operator has connected it. Those messages go to the email on
          the adult account, never to a child profile.
        </p>
      </LegalSection>

      <LegalSection heading="Who processes this information">
        <p>The app relies on these services to run:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Supabase, for accounts, the database, and uploaded files</li>
          <li>Vercel, for hosting the website</li>
          <li>bible-api.com, for public-domain chapter text</li>
          <li>API.Bible, when an in-app licensed edition is enabled</li>
          <li>Resend, when email sending is enabled</li>
        </ul>
        <p>
          Group admins and classroom teachers also see the information needed to
          run the group or class they belong to.
        </p>
      </LegalSection>

      <LegalSection heading="How long it is kept">
        <p>
          Account, group, and child-profile information stays until you delete
          it or ask for it to be deleted, or until the operator closes the
          service. Error reports kept in hosting logs are used to fix outages
          and are not used to build a profile of you.
        </p>
      </LegalSection>

      <LegalSection heading="Your choices">
        <p>
          You can stop using Meditate at any time. To review, correct, or delete
          your account or a child profile, email the contact address below.
          You can also stop password-reset and notification email by closing
          the account.
        </p>
        {email ? (
          <p>
            Contact: <a className="font-medium text-gold hover:underline" href={`mailto:${email}`}>{email}</a>
          </p>
        ) : (
          <p>
            A public contact address has not been published on this deployment
            yet. Until it is, ask a group or classroom admin to reach the site
            operator.
          </p>
        )}
      </LegalSection>
    </LegalPage>
  );
}
