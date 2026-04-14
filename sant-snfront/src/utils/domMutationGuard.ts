let isDomMutationGuardInstalled = false;

/**
 * Guard against external DOM mutations (extensions/auto-translate) that can
 * trigger NotFoundError during React reconciliation.
 */
export const installDomMutationGuard = (): void => {
  if (isDomMutationGuardInstalled || typeof window === "undefined") {
    return;
  }

  isDomMutationGuardInstalled = true;

  const nodeProto = window.Node?.prototype;
  if (!nodeProto) return;

  const originalRemoveChild = nodeProto.removeChild;
  const originalInsertBefore = nodeProto.insertBefore;

  nodeProto.removeChild = function <T extends Node>(child: T): T {
    if (!child || child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  nodeProto.insertBefore = function <T extends Node>(
    newNode: T,
    referenceNode: Node | null
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return this.appendChild(newNode) as T;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
};
