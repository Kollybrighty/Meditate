import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalPage,
  LegalSection,
  contactEmail,
} from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use — Meditate",
  description: "Terms for using Meditate group Bible study and Kids classrooms.",
};

export default function TermsPage() {
  const email = contactEmail();

  return (
    <LegalPage title="Terms of Use">
      <LegalSection heading="Using Meditate">
        <p>
          Meditate is a tool for group Bible reading, discussion, and Kids
          classrooms. By creating an account you agree to these terms and the{" "}
          <Link href="/privacy" className="font-medium text-gold hover:underline">
            Privacy Policy
          </Link>
          . These terms are not legal advice.
        </p>
      </LegalSection>

      <LegalSection heading="Accounts">
        <p>
          You must be at least 18 years old to create an account. You are
          responsible for the activity under your login and for keeping your
          password private. Use your own email address. Do not share an account
          with a group of people.
        </p>
      </LegalSection>

      <LegalSection heading="Kids classrooms">
        <p>
          Only a parent or guardian may create a child profile, and only for a
          child they are responsible for. Children do not receive their own
          logins. Teachers and hosts may admit children, run lessons, and see
          quiz answers and class participation for their own classroom. Do not
          enroll a child in a class you are not authorized to join.
        </p>
      </LegalSection>

      <LegalSection heading="What you post">
        <p>
          You keep ownership of the questions, replies, voice notes, and lesson
          files you upload. You give Meditate permission to store and show that
          material to the people in the group or classroom you posted it to.
          Do not post anything you do not have the right to share.
        </p>
        <p>
          Bible text shown in the app stays under the license of its publisher.
          Public-domain editions can be read inside Meditate. Licensed editions
          are shown only as the publisher allows, or opened on Bible Gateway.
        </p>
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <p>Do not use Meditate to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Harass, exploit, or endanger another person, especially a child</li>
          <li>Post illegal content, or content you do not have rights to</li>
          <li>Break into another account, or scrape the service in bulk</li>
          <li>Send spam, or pretend to be someone else</li>
        </ul>
        <p>
          Group owners and classroom hosts may remove members. The site operator
          may suspend an account that breaks these terms.
        </p>
      </LegalSection>

      <LegalSection heading="The service itself">
        <p>
          Meditate is provided as available. Reading plans, audio, email, and
          live classrooms can be interrupted. The app does not replace your
          local church, a parent, or a teacher. Scripture in the app is for
          personal and group study.
        </p>
        <p>
          You may stop using Meditate at any time. The operator may retire the
          service. On request, account and child-profile data can be deleted as
          described in the Privacy Policy.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        {email ? (
          <p>
            Questions about these terms:{" "}
            <a className="font-medium text-gold hover:underline" href={`mailto:${email}`}>
              {email}
            </a>
          </p>
        ) : (
          <p>
            A public contact address has not been published on this deployment
            yet. Until it is, reach the site operator through a group or
            classroom admin.
          </p>
        )}
      </LegalSection>
    </LegalPage>
  );
}
