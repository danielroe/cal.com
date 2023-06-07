import type { App_RoutingForms_Form, User } from "@prisma/client";

import { isUserMemberOfTeam, hasUserWriteAccessToEntity } from "@calcom/lib/hasUserWriteAccessToEntity";
import prisma from "@calcom/prisma";

export async function canCreateEntity({
  targetTeamId,
  userId,
}: {
  targetTeamId: number | null | undefined;
  userId: number;
}) {
  if (targetTeamId) {
    // If form doesn't exist and it is being created for a team. Check if user is the member of the team
    const _isUserMemberOfTeam = await isUserMemberOfTeam(targetTeamId, userId);
    const creationAllowed = _isUserMemberOfTeam;
    return creationAllowed;
  }
  return true;
}

export async function isFormCreateEditAllowed({
  formId,
  userId,
  /**
   * Valid when a new form is being created for a team
   */
  targetTeamId,
}: {
  userId: User["id"];
  formId: App_RoutingForms_Form["id"];
  targetTeamId: App_RoutingForms_Form["teamId"] | null;
}) {
  const form = await prisma.app_RoutingForms_Form.findUnique({
    where: {
      id: formId,
    },
    select: {
      userId: true,
      teamId: true,
      team: {
        select: {
          members: true,
        },
      },
    },
  });

  if (!form) {
    return await canCreateEntity({
      targetTeamId,
      userId,
    });
  }

  return hasUserWriteAccessToEntity(form, userId);
}
