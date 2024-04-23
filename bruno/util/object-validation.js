function validateObject(obj) {
    if (obj.type === 'marking-definition') {
        // Special case for marking definitions
        expect(obj).to.have.property('id').that.is.a('string');
        expect(obj).to.have.property('type').that.equals('marking-definition');
        expect(obj).to.have.property('created').that.is.a('string');
        expect(obj).to.have.property('definition_type').that.is.a('string');
        expect(obj).to.have.property('definition').that.is.an('object');

        if (obj.hasOwnProperty('spec_version')) {
            expect(obj.spec_version).to.be.a('string');
        }

        if (obj.hasOwnProperty('created_by_ref')) {
            expect(obj.created_by_ref).to.be.a('string');
        }
    } else {
        // Standard rules for other objects
        expect(obj).to.have.property('id').that.is.a('string');
        expect(obj).to.have.property('type').that.is.a('string');
        expect(obj).to.have.property('created').that.is.a('string');
        expect(obj).to.have.property('modified').that.is.a('string');

        if (obj.hasOwnProperty('spec_version')) {
            expect(obj.spec_version).to.be.a('string');
        }

        if (obj.hasOwnProperty('created_by_ref')) {
            expect(obj.created_by_ref).to.be.a('string');
        }

        if (obj.hasOwnProperty('revoked')) {
            expect(obj.revoked).to.be.a('boolean');
        }

        if (obj.hasOwnProperty('labels')) {
            expect(obj.labels).to.be.an('array');
        }

        if (obj.hasOwnProperty('confidence')) {
            expect(obj.confidence).to.be.a('number');
        }

        if (obj.hasOwnProperty('lang')) {
            expect(obj.lang).to.be.a('string');
        }

        if (obj.hasOwnProperty('external_references')) {
            expect(obj.external_references).to.be.an('array');
        }

        if (obj.hasOwnProperty('object_marking_refs')) {
            expect(obj.object_marking_refs).to.be.an('array');
        }

        if (obj.hasOwnProperty('granular_markings')) {
            expect(obj.granular_markings).to.be.an('array');
        }

        if (obj.hasOwnProperty('defanged')) {
            expect(obj.defanged).to.be.a('boolean');
        }

        if (obj.hasOwnProperty('extensions')) {
            expect(obj.extensions).to.be.an('object');
        }

        // MITRE ATT&CK specific properties
        if (obj.hasOwnProperty('x_mitre_platforms')) {
            expect(obj.x_mitre_platforms).to.be.an('array');
        }

        if (obj.hasOwnProperty('x_mitre_domains')) {
            expect(obj.x_mitre_domains).to.be.an('array');
        }

        if (obj.hasOwnProperty('x_mitre_contributors')) {
            expect(obj.x_mitre_contributors).to.be.an('array');
        }

        if (obj.hasOwnProperty('x_mitre_data_sources')) {
            expect(obj.x_mitre_data_sources).to.be.an('array');
        }

        if (obj.hasOwnProperty('x_mitre_version')) {
            expect(obj.x_mitre_version).to.be.a('string');
        }

        if (obj.hasOwnProperty('x_mitre_permissions_required')) {
            expect(obj.x_mitre_permissions_required).to.be.an('array');
        }

        if (obj.hasOwnProperty('x_mitre_is_subtechnique')) {
            expect(obj.x_mitre_is_subtechnique).to.be.a('boolean');
        }

        if (obj.hasOwnProperty('x_mitre_detection')) {
            expect(obj.x_mitre_detection).to.be.a('string');
        }

        if (obj.hasOwnProperty('x_mitre_modified_by_ref')) {
            expect(obj.x_mitre_modified_by_ref).to.be.a('string');
        }
    }
}

module.exports = {
    validateObject
};