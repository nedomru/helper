/**
 * Shows client agreement number on request change page.
 *
 * Gets agreement number from agr_num input.
 * There is no other elements containing agreement number on this page.
 */
export function showAgreementOnRequestChange(): void {
    const headerText: HTMLElement | null = document.querySelector(".text-primary");
    const agreement_num: HTMLInputElement | null = document.querySelector('input[name="agr_num"]');

    if (headerText && agreement_num) {
        headerText.textContent = `Обращение по договору №${agreement_num.value}`;
    }
}
