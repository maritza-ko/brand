export interface ValidationResult {
    isValid: boolean;
    errorMessage?: string;
}

/**
 * 브랜드 아이디어 입력을 검증합니다.
 * 성의 없는 입력을 필터링하여 시스템 품질을 유지합니다.
 */
export function validateBrandIdea(idea: string): ValidationResult {
    // 1. 공백 제거 후 실제 내용 확인
    const trimmed = idea.trim();

    // 2. 빈 입력
    if (!trimmed) {
        return {
            isValid: false,
            errorMessage: "브랜드 아이디어를 입력해주세요."
        };
    }

    // 3. 최소 길이 체크 (10자 이상)
    if (trimmed.length < 10) {
        return {
            isValid: false,
            errorMessage: "브랜드 아이디어를 최소 10자 이상 구체적으로 작성해주세요. 예: '친구들과 하루 종일 놀 수 있는 쾌적한 PC방'"
        };
    }

    // 4. 의미 없는 반복 문자 체크 (ㅋㅋㅋ, ㅎㅎㅎ, ..., !!!, ???, ㅠㅠㅠ 등)
    const repeatPatterns = [
        /ㅋ{3,}/g,    // ㅋㅋㅋ
        /ㅎ{3,}/g,    // ㅎㅎㅎ
        /ㅠ{3,}/g,    // ㅠㅠㅠ
        /\.{3,}/g,    // ...
        /!{3,}/g,     // !!!
        /\?{3,}/g,    // ???
        /~{3,}/g,     // ~~~
    ];

    for (const pattern of repeatPatterns) {
        if (pattern.test(trimmed)) {
            return {
                isValid: false,
                errorMessage: "의미 있는 브랜드 아이디어를 작성해주세요. 반복 문자나 특수문자만으로는 제대로 된 전략을 생성할 수 없습니다."
            };
        }
    }

    // 5. 특수문자나 공백만 있는 경우
    const withoutSpecialChars = trimmed.replace(/[^a-zA-Z0-9가-힣]/g, '');
    if (withoutSpecialChars.length < 5) {
        return {
            isValid: false,
            errorMessage: "의미 있는 텍스트를 포함해주세요. 특수문자만으로는 브랜드 전략을 생성할 수 없습니다."
        };
    }

    // 6. 숫자만 있는 경우
    if (/^\d+$/.test(trimmed)) {
        return {
            isValid: false,
            errorMessage: "브랜드 아이디어를 문장으로 설명해주세요. 숫자만으로는 전략을 생성할 수 없습니다."
        };
    }

    // 모든 검증 통과
    return {
        isValid: true
    };
}

/**
 * 검증 결과에 따라 사용자 친화적인 에러 메시지를 반환합니다.
 */
export function getValidationErrorMessage(result: ValidationResult): string | null {
    return result.isValid ? null : result.errorMessage || "유효하지 않은 입력입니다.";
}
