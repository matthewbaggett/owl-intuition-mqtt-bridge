pipeline {
    agent any
    options {
        disableConcurrentBuilds()
        timeout(time: 2, unit: 'HOURS')
    }
    stages {
        stage('Prepare') {
            steps {
                sh 'make prepare'
            }
        }
        stage('Build') {
            steps {
                 sh 'make build'
            }
        }
        stage('Push') {
            steps {
                 sh 'make push'
            }
        }
    }
    post{
        always{
            cleanWs()
        }
    }
}