export enum StixIdentityPrefix {
    ATTACK_PATTERN = 'attack-pattern',
    TACTIC = 'x-mitre-tactic',
    MALWARE = 'malware',
    TOOL = 'tool',
    GROUP = 'intrusion-set',
    MITIGATION = 'course-of-action',
    MATRIX = 'x-mitre-matrix',
    IDENTITY = 'identity',
    MARKING_DEF = 'marking-definition',
    RELATIONSHIP = 'relationship',
    NOTE = 'note'
}

export enum WorkbenchRESTEndpoint {
    ATTACK_PATTERN = '/api/techniques/',
    TACTIC = '/api/tactics/',
    MALWARE = '/api/software/',
    TOOL = '/api/software/',
    GROUP = '/api/groups/',
    MITIGATION = '/api/mitigations/',
    MATRIX = '/api/matrices/',
    IDENTITY = '/api/identities/',
    MARKING_DEF = '/api/marking-definition/',
    RELATIONSHIP = '/api/relationships/',
    NOTE = '/api/notes/'
}