# frozen_string_literal: true

require 'uri'

public_url = ENV.fetch('SPREE_PUBLIC_URL')
public_uri = URI.parse(public_url)

unless public_uri.is_a?(URI::HTTP) &&
       public_uri.host.present? &&
       public_uri.userinfo.nil? &&
       public_uri.query.nil? &&
       public_uri.fragment.nil? &&
       public_uri.port == public_uri.default_port &&
       ['', '/'].include?(public_uri.path)
  message = 'SPREE_PUBLIC_URL must be an absolute HTTP(S) origin without credentials, ' \
            'non-default port, path, query, or fragment'
  raise ArgumentError, message
end

Spree.cdn_host = public_uri.host
